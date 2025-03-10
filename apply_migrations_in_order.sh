#!/bin/bash
# Script to apply all migrations from the apps/api/supabase/migrations directory in order

# Set colors for better output readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Starting Migration Process =====${NC}"

# Check if we're logged in to Supabase
npx supabase projects list > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}You are not logged in to Supabase. Please run 'npx supabase login' first.${NC}"
  exit 1
fi

# Check if the project is linked
PROJECT_REF=$(grep "project_ref" supabase/config.toml 2>/dev/null | awk -F '=' '{print $2}' | tr -d ' "')
if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}Project not linked. Please run 'npx supabase link --project-ref your-project-ref' first.${NC}"
  exit 1
fi

echo -e "${YELLOW}Project ref: $PROJECT_REF${NC}"

# First, reset the database if needed
echo -e "${YELLOW}Do you want to reset the database first? (y/n)${NC}"
read -r reset_db
if [[ "$reset_db" =~ ^[Yy]$ ]]; then
  echo -e "${RED}WARNING: This will delete all data in your database.${NC}"
  echo -e "${YELLOW}Are you ABSOLUTELY sure? (yes/no)${NC}"
  read -r confirm_reset
  if [[ "$confirm_reset" == "yes" ]]; then
    echo -e "${BLUE}Resetting database...${NC}"
    # Connect to Supabase and run the reset script via SQL
    echo "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;" | PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres
    echo -e "${GREEN}Database reset complete.${NC}"
  else
    echo -e "${YELLOW}Database reset cancelled.${NC}"
  fi
fi

# Get the list of migration files in order
echo -e "${BLUE}Collecting migration files...${NC}"
MIGRATIONS=$(find apps/api/supabase/migrations -name "*.sql" | sort)

# Apply each migration one by one
for migration in $MIGRATIONS; do
  filename=$(basename "$migration")
  echo -e "${YELLOW}Applying migration: $filename${NC}"
  
  # Read the SQL content
  sql_content=$(<"$migration")
  
  # Apply the migration
  echo "$sql_content" | PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully applied migration: $filename${NC}"
  else
    echo -e "${RED}✗ Failed to apply migration: $filename${NC}"
    echo -e "${YELLOW}Do you want to continue with the remaining migrations? (y/n)${NC}"
    read -r continue_migrations
    if [[ ! "$continue_migrations" =~ ^[Yy]$ ]]; then
      echo -e "${RED}Migration process aborted.${NC}"
      exit 1
    fi
  fi
done

echo -e "${GREEN}===== Migration process completed =====${NC}"
echo -e "${BLUE}Checking migration status...${NC}"
npx supabase migration list

echo -e "${YELLOW}Do you want to update the migration history table in Supabase? (y/n)${NC}"
read -r update_history
if [[ "$update_history" =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Updating migration history table...${NC}"
  for migration in $MIGRATIONS; do
    filename=$(basename "$migration")
    version="${filename%_*}"
    
    # Skip if not a proper version number
    if ! [[ "$version" =~ ^[0-9]+$ ]]; then
      echo -e "${YELLOW}Skipping $filename as it doesn't have a standard version format.${NC}"
      continue
    fi
    
    echo -e "${YELLOW}Marking $version as applied...${NC}"
    npx supabase migration repair --status applied "$version"
  done
  echo -e "${GREEN}Migration history updated.${NC}"
fi

echo -e "${GREEN}All done! Your database should now be up to date.${NC}" 