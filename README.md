Set up instructions


1. Create psql container:

    docker run --name cryptrail -d -p 5432:5432 -e POSTGRES_PASSWORD=admin123 postgres

2. Check containers name
    
    docker ps

3. Container start and stop (import or exporting schema)

    Start:

        docker-compose up -d
        docker exec -it 167933cc2154 psql -U postgres

    Stop:

        ./compose-down.sh
        docker compose down