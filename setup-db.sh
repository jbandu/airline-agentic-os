#!/bin/bash

# Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
echo "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE airline_agentic_os;"
sudo -u postgres psql -c "CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE airline_agentic_os TO postgres;"
sudo -u postgres psql -c "ALTER DATABASE airline_agentic_os OWNER TO postgres;"

echo "PostgreSQL setup complete!"
echo "Database: airline_agentic_os"
echo "User: postgres"
echo "Password: postgres"
echo "Connection string: postgresql://postgres:postgres@localhost:5432/airline_agentic_os"
