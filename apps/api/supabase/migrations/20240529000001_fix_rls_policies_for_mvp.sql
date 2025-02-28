-- Drop existing policies that might be restricting access
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Create an open policy for development purposes
-- IMPORTANT: This is only for local development - DO NOT USE IN PRODUCTION
COMMENT ON TABLE events IS 'Table storing event information with temporary open access for MVP development';

-- Create development-only policies that allow all operations
CREATE POLICY "Dev: Allow all select operations"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Dev: Allow all insert operations"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Dev: Allow all update operations"
  ON events FOR UPDATE
  USING (true);

CREATE POLICY "Dev: Allow all delete operations"
  ON events FOR DELETE
  USING (true);

-- Add a comment indicating this is temporary
COMMENT ON POLICY "Dev: Allow all select operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all insert operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all update operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase';
COMMENT ON POLICY "Dev: Allow all delete operations" ON events IS 'TEMPORARY: Development-only policy for MVP phase'; 