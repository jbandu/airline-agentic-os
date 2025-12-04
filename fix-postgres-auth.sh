#!/bin/bash

echo "Fixing PostgreSQL authentication..."

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Ensure database exists and has proper ownership
sudo -u postgres psql -c "CREATE DATABASE airline_agentic_os;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE airline_agentic_os TO postgres;"

echo "Testing connection..."
PGPASSWORD=postgres psql -U postgres -h localhost -d airline_agentic_os -c "SELECT 'Connection successful!' as status;"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ PostgreSQL authentication fixed successfully!"
    echo "You can now run: npm run db:push"
else
    echo ""
    echo "✗ There may still be authentication issues. Check pg_hba.conf settings."
fi
