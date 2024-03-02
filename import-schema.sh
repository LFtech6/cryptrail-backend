#!/bin/bash
set -e

CONTAINER_NAME="cryptrail"
DB_USER="postgres"
DB_NAME="cryptrail"
SCHEMA_FILE="./init/schema.sql"

# Wait for PostgreSQL to start
until docker exec $CONTAINER_NAME pg_isready -U $DB_USER; do
  echo "Waiting for PostgreSQL to become ready..."
  sleep 1
done

# Import the schema to the database
echo "Importing schema to $DB_NAME"
cat $SCHEMA_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
