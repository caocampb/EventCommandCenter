-- Full Database Reset Script for Supabase
-- WARNING: This will delete ALL data in the database
-- Only run this if you are sure you want to completely reset your database

-- Drop all existing tables, views, functions, etc.
DROP SCHEMA public CASCADE;

-- Recreate the public schema
CREATE SCHEMA public;

-- Set default privileges
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- The database is now completely empty
-- Your migrations will recreate all necessary tables and objects when you deploy 