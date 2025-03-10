-- Create vendor_documents table to store document metadata
CREATE TABLE IF NOT EXISTS public.vendor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);

-- Enable RLS policies
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- For simplicity in development, allow all authenticated users to access vendor documents
CREATE POLICY "Enable all operations for authenticated users" ON public.vendor_documents
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_vendor_documents_updated_at ON public.vendor_documents;
CREATE TRIGGER set_vendor_documents_updated_at
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 