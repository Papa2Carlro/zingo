package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
)

type EventHandler struct {
	eventService *service.EventService
}

func NewEventHandler(eventService *service.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

type IngestEventRequest struct {
	PhraseID  uint   `json:"phrase_id" binding:"required"`
	Category  string `json:"category" binding:"required"`
	Platform  string `json:"platform" binding:"required"`
	AnonHash  string `json:"anon_hash" binding:"required"`
	UserID    *uint  `json:"user_id,omitempty"`
}

func (h *EventHandler) Ingest(c *gin.Context) {
	var req IngestEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := &model.Event{
		PhraseID: req.PhraseID,
		Category: req.Category,
		Platform: req.Platform,
		AnonHash: req.AnonHash,
		UserID:   req.UserID,
	}

	if err := h.eventService.Ingest(c.Request.Context(), event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "ok"})
}

func (h *EventHandler) GetUserHistory(c *gin.Context) {
	anonHash := c.Query("anon_hash")
	if anonHash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "anon_hash required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	events, err := h.eventService.GetUserHistory(c.Request.Context(), anonHash, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) GetStats(c *gin.Context) {
	period := c.DefaultQuery("period", "week")
	stats, err := h.eventService.GetStatsByCategory(c.Request.Context(), getSince(period))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func getSince(period string) time.Time {
	now := time.Now().UTC()
	switch period {
	case "day":
		return now.AddDate(0, 0, -1)
	case "week":
		return now.AddDate(0, 0, -7)
	case "month":
		return now.AddDate(0, -1, 0)
	default:
		return now.AddDate(0, 0, -7)
	}
}