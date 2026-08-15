.PHONY: run build test migrate migrate-down seed docker-build docker-up docker-down tidy

# Go
run:
	go run ./cmd/api

build:
	go build -o bin/api ./cmd/api

test:
	go test -v ./...

tidy:
	go mod tidy

# Database
migrate:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

seed:
	go run ./cmd/seed

# Docker
docker-build:
	docker build -t zingo-backend .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Dev
dev: docker-up
	sleep 3
	go run ./cmd/api

# All
all: tidy build test