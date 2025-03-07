-- Add unique constraint to email column in participants table
ALTER TABLE participants ADD CONSTRAINT participants_email_key UNIQUE (email); 