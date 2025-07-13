
-- Fix children table structure
-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS public.children CASCADE;

CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own children" 
  ON public.children 
  FOR SELECT 
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can create their own children" 
  ON public.children 
  FOR INSERT 
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children" 
  ON public.children 
  FOR UPDATE 
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children" 
  ON public.children 
  FOR DELETE 
  USING (auth.uid() = parent_id);

-- Add index
CREATE INDEX idx_children_parent_id ON public.children(parent_id);

-- Create updated_at trigger
CREATE TRIGGER update_children_updated_at 
    BEFORE UPDATE ON public.children 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
