package config

import (
	"fmt"
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Admin    AdminConfig
	RateLimit RateLimitConfig
	CORS     CORSConfig
	Log      LogConfig
}

type ServerConfig struct {
	Host string
	Port string
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func (d DatabaseConfig) DSN() string {
	return "host=" + d.Host + " port=" + d.Port + " user=" + d.User +
		" password=" + d.Password + " dbname=" + d.Name + " sslmode=" + d.SSLMode
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

func (r RedisConfig) Addr() string {
	return r.Host + ":" + r.Port
}

type JWTConfig struct {
	Secret     string
	ExpiryHours int
}

type AdminConfig struct {
	Token string
}

type RateLimitConfig struct {
	Anon     int
	Auth     int
	WindowMinutes int
}

type CORSConfig struct {
	AllowedOrigins string
}

type LogConfig struct {
	Level  string
	Format string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Port: getEnv("SERVER_PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "zingo"),
			Password: getEnv("DB_PASSWORD", "zingo"),
			Name:     getEnv("DB_NAME", "zingo"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "change-me"),
			ExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 24),
		},
		Admin: AdminConfig{
			Token: getEnv("ADMIN_TOKEN", "change-me"),
		},
		RateLimit: RateLimitConfig{
			Anon:          getEnvInt("RATE_LIMIT_ANON", 100),
			Auth:          getEnvInt("RATE_LIMIT_AUTH", 1000),
			WindowMinutes: getEnvInt("RATE_LIMIT_WINDOW_MINUTES", 1),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "*"),
		},
		Log: LogConfig{
			Level:  getEnv("LOG_LEVEL", "debug"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if val := os.Getenv(key); val != "" {
		var result int
		_, _ = fmt.Sscanf(val, "%d", &result)
		if result > 0 {
			return result
		}
	}
	return defaultValue
}