package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
)

type AnalyticsHandler struct {
	analyticsService *service.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

func (h *AnalyticsHandler) GetTopPhrases(c *gin.Context) {
	period := c.DefaultQuery("period", "week")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	stats, err := h.analyticsService.GetTopPhrases(c.Request.Context(), period, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AnalyticsHandler) GetCategoryStats(c *gin.Context) {
	period := c.DefaultQuery("period", "week")
	stats, err := h.analyticsService.GetCategoryStats(c.Request.Context(), period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *AnalyticsHandler) GetTrends(c *gin.Context) {
	period := c.DefaultQuery("period", "week")
	trends, err := h.analyticsService.GetTrends(c.Request.Context(), period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, trends)
}