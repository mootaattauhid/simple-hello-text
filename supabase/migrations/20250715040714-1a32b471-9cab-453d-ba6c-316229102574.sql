
-- Buat tabel untuk data siswa (master data)
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nik VARCHAR(16) NOT NULL UNIQUE,
  nis VARCHAR(20),
  name TEXT NOT NULL,
  class_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat tabel untuk kelas yang dapat diatur admin
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tambah kolom NIK dan NIS ke tabel children
ALTER TABLE public.children 
ADD COLUMN nik VARCHAR(16),
ADD COLUMN nis VARCHAR(20);

-- Buat index untuk performa pencarian
CREATE INDEX idx_students_nik ON public.students(nik);
CREATE INDEX idx_children_nik ON public.children(nik);

-- RLS policies untuk tabel students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view students" 
  ON public.students 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage students" 
  ON public.students 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS policies untuk tabel classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active classes" 
  ON public.classes 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage classes" 
  ON public.classes 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert beberapa kelas default
INSERT INTO public.classes (name, description) VALUES
('1A', 'Kelas 1A'),
('1B', 'Kelas 1B'),
('2A', 'Kelas 2A'),
('2B', 'Kelas 2B'),
('3A', 'Kelas 3A'),
('3B', 'Kelas 3B');
