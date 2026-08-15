package middleware

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/Papa2Carlro/zingo/backend/pkg/config"
)

func RateLimitMiddleware(cfg *config.Config, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := getRateLimitKey(c, cfg)
		if key == "" {
			c.Next()
			return
		}

		ctx := context.Background()
		limit := getLimit(c, cfg)
		window := time.Duration(cfg.RateLimit.WindowMinutes) * time.Minute

		current, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			c.Next()
			return
		}

		if current == 1 {
			rdb.Expire(ctx, key, window)
		}

		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(max(0, limit-int(current))))

		if current > int64(limit) {
			ttl, _ := rdb.TTL(ctx, key).Result()
			c.Header("Retry-After", strconv.Itoa(int(ttl.Seconds())))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": int(ttl.Seconds()),
			})
			return
		}

		c.Next()
	}
}

func getRateLimitKey(c *gin.Context, cfg *config.Config) string {
	// Check for API Key first
	apiKey := c.GetHeader("X-API-Key")
	if apiKey != "" {
		return "ratelimit:apikey:" + apiKey
	}

	// Check for authenticated user
	if userID, exists := c.Get("user_id"); exists {
		return "ratelimit:user:" + strconv.FormatUint(uint64(userID.(uint)), 10)
	}

	// Fallback to anon_hash from header or IP
	anonHash := c.GetHeader("X-Anon-Hash")
	if anonHash == "" {
		anonHash = c.ClientIP()
	}
	return "ratelimit:anon:" + anonHash
}

func getLimit(c *gin.Context, cfg *config.Config) int {
	if _, exists := c.Get("user_id"); exists {
		return cfg.RateLimit.Auth
	}
	apiKey := c.GetHeader("X-API-Key")
	if apiKey != "" {
		return cfg.RateLimit.Auth * 10 // Higher limit for API keys
	}
	return cfg.RateLimit.Anon
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}