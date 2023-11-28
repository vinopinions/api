#!/bin/sh

docker run \
    -e POSTGRES_USER=vinopinions-api \
    -e POSTGRES_PASSWORD=JfK9pC^2Uq4&sn \
    -e POSTGRES_DB=vinopinions-db \
    -e POSTGRES_PORT=5432 \
    -p 5432:5432 \
    postgres:latest
