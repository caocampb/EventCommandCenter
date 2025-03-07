-- Create a storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Set up security policy for the vendor documents bucket
-- Only authenticated users can access
CREATE POLICY "Authenticated users can access vendor documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'vendor-documents' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'vendor-documents' 
  AND auth.role() = 'authenticated'
); 