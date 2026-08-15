package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
)

type WSHandler struct {
	analyticsService *service.AnalyticsService
	upgrader         websocket.Upgrader
}

func NewWSHandler(analyticsService *service.AnalyticsService) *WSHandler {
	return &WSHandler{
		analyticsService: analyticsService,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (h *WSHandler) Leaderboard(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// Send initial data
	top, _ := h.analyticsService.GetTopPhrases(c.Request.Context(), "week", 10)
	conn.WriteJSON(map[string]interface{}{
		"type": "leaderboard",
		"data": top,
	})

	// Keep connection alive, send updates periodically
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			top, _ := h.analyticsService.GetTopPhrases(c.Request.Context(), "week", 10)
			conn.WriteJSON(map[string]interface{}{
				"type": "leaderboard",
				"data": top,
			})
		case <-c.Request.Context().Done():
			return
		}
	}
}