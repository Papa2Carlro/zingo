package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/Papa2Carlro/zingo/backend/internal/handler"
	"github.com/Papa2Carlro/zingo/backend/internal/middleware"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
	"github.com/Papa2Carlro/zingo/backend/pkg/config"
	"github.com/Papa2Carlro/zingo/backend/pkg/db"
	"github.com/Papa2Carlro/zingo/backend/pkg/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Config error: %v\n", err)
		os.Exit(1)
	}

	logger.Init(cfg.Log.Level, cfg.Log.Format)
	log := logger.Get()

	database, err := db.New(cfg.Database.DSN())
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	// Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	defer rdb.Close()

	// Repos
	phraseRepo := repo.NewPhraseRepo(database)
	eventRepo := repo.NewEventRepo(database)
	userRepo := repo.NewUserRepo(database)
	presetRepo := repo.NewPresetRepo(database)

	// Services
	phraseService := service.NewPhraseService(phraseRepo, eventRepo)
	eventService := service.NewEventService(eventRepo)
	authService := service.NewAuthService(userRepo, cfg)
	presetService := service.NewPresetService(presetRepo, phraseRepo)
	analyticsService := service.NewAnalyticsService(eventRepo)

	// Handlers
	phraseHandler := handler.NewPhraseHandler(phraseService)
	eventHandler := handler.NewEventHandler(eventService)
	authHandler := handler.NewAuthHandler(authService)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)
	adminHandler := handler.NewAdminHandler(phraseService, presetService, analyticsService)
	wsHandler := handler.NewWSHandler(analyticsService)

	// Gin
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimitMiddleware(cfg, rdb))
	r.Use(middleware.AuthMiddleware(cfg))

	// Public API v1
	v1 := r.Group("/api/v1")
	{
		v1.GET("/phrases", phraseHandler.GetAll)
		v1.GET("/phrases/:category", phraseHandler.GetByCategory)
		v1.POST("/events", eventHandler.Ingest)
		v1.GET("/events/history", eventHandler.GetUserHistory)
		v1.GET("/analytics/top", analyticsHandler.GetTopPhrases)
		v1.GET("/analytics/categories", analyticsHandler.GetCategoryStats)
		v1.GET("/analytics/trends", analyticsHandler.GetTrends)

		// Auth
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.GET("/auth/me", authHandler.Me)
	}

	// Admin API
	admin := r.Group("/api/v1/admin")
	admin.Use(middleware.AdminOnly(cfg))
	{
		admin.GET("/phrases", adminHandler.GetPhrases)
		admin.POST("/phrases", adminHandler.CreatePhrase)
		admin.PATCH("/phrases/:id", adminHandler.UpdatePhrase)
		admin.DELETE("/phrases/:id", adminHandler.DeletePhrase)
		admin.GET("/stats", adminHandler.GetStats)
	}

	// WebSocket
	r.GET("/ws/v1/leaderboard", wsHandler.Leaderboard)

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Server
	srv := &http.Server{
		Addr:    cfg.Server.Host + ":" + cfg.Server.Port,
		Handler: r,
	}

	go func() {
		log.Info().Str("addr", srv.Addr).Msg("Starting server")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}
	log.Info().Msg("Server exited")
}