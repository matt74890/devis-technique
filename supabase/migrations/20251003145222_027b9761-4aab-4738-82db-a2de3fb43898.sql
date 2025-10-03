-- Add pdf_url column to archived_quotes table
ALTER TABLE public.archived_quotes
ADD COLUMN pdf_url text;

-- Create storage bucket for archived PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('archived_pdfs', 'archived_pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for archived_pdfs bucket
CREATE POLICY "Users can view their own archived PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'archived_pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own archived PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'archived_pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own archived PDFs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'archived_pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own archived PDFs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'archived_pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);