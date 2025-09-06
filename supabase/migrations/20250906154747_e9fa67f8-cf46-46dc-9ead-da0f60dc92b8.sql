-- Fix the security issue with the search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, settings)
  VALUES (NEW.id, '{}'::jsonb);
  RETURN NEW;
END;
$$;