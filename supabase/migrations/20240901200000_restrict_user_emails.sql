-- Create a table to store allowed emails
CREATE TABLE IF NOT EXISTS public.allowed_users (
  email TEXT PRIMARY KEY
);

-- Insert the two allowed emails (replace with your actual email addresses)
INSERT INTO public.allowed_users (email) VALUES 
  ('email1@example.com'),
  ('email2@example.com');

-- Create an RLS policy on auth.users table to restrict sign-ups
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a policy that only allows specific emails to sign up
CREATE POLICY "Only allow specific emails to sign up" 
  ON auth.users
  FOR INSERT
  WITH CHECK (email IN (SELECT email FROM public.allowed_users));

-- Grant necessary permissions
GRANT SELECT ON public.allowed_users TO authenticated;
GRANT SELECT ON public.allowed_users TO anon; 