-- Create table for archived quotes
CREATE TABLE public.archived_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quote_ref TEXT NOT NULL,
  client_name TEXT NOT NULL,
  quote_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('archived', 'validated')),
  subtotal_ht NUMERIC(10, 2) NOT NULL,
  total_ttc NUMERIC(10, 2) NOT NULL,
  quote_data JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.archived_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own archived quotes" 
ON public.archived_quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archived quotes" 
ON public.archived_quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own archived quotes" 
ON public.archived_quotes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archived quotes" 
ON public.archived_quotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_archived_quotes_updated_at
BEFORE UPDATE ON public.archived_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_archived_quotes_user_date ON public.archived_quotes(user_id, quote_date DESC);
CREATE INDEX idx_archived_quotes_status ON public.archived_quotes(user_id, status);