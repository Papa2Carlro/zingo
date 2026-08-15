package main

import (
	"flag"
	"fmt"
	"os"

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

	dsn := cfg.Database.DSN()
	m, err := migrate.New(
		"file://migrations",
		"postgres://"+dsn,
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