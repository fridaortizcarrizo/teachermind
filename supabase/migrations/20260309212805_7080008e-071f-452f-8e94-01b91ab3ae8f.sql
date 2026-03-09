-- Create storage bucket for lesson PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-pdfs', 'lesson-pdfs', false);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload lesson PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson-pdfs');

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read lesson PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lesson-pdfs');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete lesson PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson-pdfs');