#!/bin/sh

docker run -d --name vinopinions-local-postgres -e POSTGRES_USER=vinopinions-api -e POSTGRES_PASSWORD=JfK9pC^2Uq4 -e POSTGRES_DB=vinopinions-db -p 5433:5432 postgres:latest
