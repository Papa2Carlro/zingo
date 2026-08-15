package logger

import (
	"os"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func Init(level, format string) {
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(lvl)

	if format == "json" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, NoColor: true})
	} else {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}
}

func Get() zerolog.Logger {
	return log.Logger
}