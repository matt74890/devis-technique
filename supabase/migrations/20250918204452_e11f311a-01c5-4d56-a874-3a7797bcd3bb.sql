-- Create signatures bucket only (logos already exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true);

-- Create policies for signatures bucket
CREATE POLICY "Users can view all signatures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'signatures');

CREATE POLICY "Users can upload their own signature" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own signature" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own signature" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);