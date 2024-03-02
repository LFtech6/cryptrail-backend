#!/bin/bash
set -e

CONTAINER_NAME="cryptrail"
DB_USER="postgres" # replace with your actual database username
DB_NAME="cryptrail" # replace with the actual name of your database
SCHEMA_FILE="./init/schema.sql"

# Export the schema to the schema.sql file
docker exec $CONTAINER_NAME pg_dump -U $DB_USER --schema-only --no-owner $DB_NAME > $SCHEMA_FILE

echo "Schema exported to $SCHEMA_FILE"

# Now bring down the containers
docker-compose down
