
-- Pastikan semua record yang ada memiliki NIK sebelum mengubah constraint
UPDATE public.students 
SET nik = COALESCE(nik, '0000000000000000') 
WHERE nik IS NULL OR nik = '';

-- Ubah kolom NIK menjadi NOT NULL
ALTER TABLE public.students 
ALTER COLUMN nik SET NOT NULL;

-- Pastikan juga di tabel children NIK bisa tetap optional tapi valid
-- Tidak perlu perubahan pada children table karena NIK di sana memang optional
