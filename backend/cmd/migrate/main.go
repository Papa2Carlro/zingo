package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/Papa2Carlro/zingo/backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Config error: %v\n", err)
		os.Exit(1)
	}

	// Convert DSN to PostgreSQL URL format for golang-migrate
	// DSN format: "host=localhost port=5432 user=zingo password=zingo dbname=zingo sslmode=disable"
	// URL format: "postgres://zingo:zingo@localhost:5432/zingo?sslmode=disable"
	dsn := cfg.Database.DSN()
	url := dsnToURL(dsn)

	m, err := migrate.New(
		"file://migrations",
		url,
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Migrate error: %v\n", err)
		os.Exit(1)
	}

	direction := flag.String("dir", "up", "Migration direction: up or down")
	flag.Parse()

	switch *direction {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			fmt.Fprintf(os.Stderr, "Migration up error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Migration up completed")
	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			fmt.Fprintf(os.Stderr, "Migration down error: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Migration down completed")
	default:
		fmt.Fprintf(os.Stderr, "Unknown direction: %s\n", *direction)
		os.Exit(1)
	}
}

func dsnToURL(dsn string) string {
	// Parse key=value pairs
	params := make(map[string]string)
	for _, part := range strings.Fields(dsn) {
		if kv := strings.SplitN(part, "=", 2); len(kv) == 2 {
			params[kv[0]] = kv[1]
		}
	}
	
	user := params["user"]
	password := params["password"]
	host := params["host"]
	port := params["port"]
	dbname := params["dbname"]
	sslmode := params["sslmode"]
	
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbname, sslmode)
}