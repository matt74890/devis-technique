-- Créer un bucket pour les logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Créer les politiques RLS pour le bucket logos
CREATE POLICY "Logos sont publiquement accessibles" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Utilisateurs authentifiés peuvent uploader leur logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Utilisateurs authentifiés peuvent modifier leur logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Utilisateurs authentifiés peuvent supprimer leur logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);