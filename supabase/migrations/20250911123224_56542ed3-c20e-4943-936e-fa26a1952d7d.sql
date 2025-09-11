-- Add first_name and last_name columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing records to split name into first_name and last_name
UPDATE public.clients 
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN 
      split_part(name, ' ', 1)
    ELSE 
      name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN 
      substring(name from position(' ' in name) + 1)
    ELSE 
      ''
  END
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);