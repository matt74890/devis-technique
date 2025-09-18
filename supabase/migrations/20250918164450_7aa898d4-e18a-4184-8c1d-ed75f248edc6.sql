-- Add user_id column to clients table to track ownership
ALTER TABLE public.clients 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL (after we set default values)
-- For now, leave it nullable until we update existing records

-- Drop the dangerous public policies
DROP POLICY "Anyone can view clients" ON public.clients;
DROP POLICY "Anyone can create clients" ON public.clients;  
DROP POLICY "Anyone can update clients" ON public.clients;
DROP POLICY "Anyone can delete clients" ON public.clients;

-- Create secure RLS policies that require authentication and user ownership
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update existing clients to be owned by the first authenticated user if any exist
-- This is a temporary measure - in production you'd need to assign ownership properly
UPDATE public.clients 
SET user_id = (
  SELECT id FROM auth.users LIMIT 1
) 
WHERE user_id IS NULL;

-- Make user_id NOT NULL now that all records have been updated
ALTER TABLE public.clients 
ALTER COLUMN user_id SET NOT NULL;