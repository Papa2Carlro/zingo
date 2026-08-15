package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
)

type AdminHandler struct {
	phraseService  *service.PhraseService
	presetService  *service.PresetService
	analyticsService *service.AnalyticsService
}

func NewAdminHandler(phraseService *service.PhraseService, presetService *service.PresetService, analyticsService *service.AnalyticsService) *AdminHandler {
	return &AdminHandler{phraseService: phraseService, presetService: presetService, analyticsService: analyticsService}
}

type CreatePhraseRequest struct {
	Text     string   `json:"text" binding:"required"`
	Variants []string `json:"variants,omitempty"`
	Weight   int      `json:"weight" binding:"required,min=1,max=10"`
	Category string   `json:"category" binding:"required"`
	Lang     string   `json:"lang,omitempty"`
	Tags     []string `json:"tags,omitempty"`
}

func (h *AdminHandler) GetPhrases(c *gin.Context) {
	phrases, err := h.phraseService.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, phrases)
}

func (h *AdminHandler) CreatePhrase(c *gin.Context) {
	var req CreatePhraseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	variantsJSON, _ := json.Marshal(req.Variants)
	tagsJSON, _ := json.Marshal(req.Tags)

	phrase := &model.Phrase{
		Text:     req.Text,
		Variants: string(variantsJSON),
		Weight:   req.Weight,
		Category: req.Category,
		Lang:     req.Lang,
		Tags:     string(tagsJSON),
	}
	if phrase.Lang == "" {
		phrase.Lang = "ru"
	}

	if err := h.phraseService.Create(c.Request.Context(), phrase); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, phrase)
}

func (h *AdminHandler) UpdatePhrase(c *gin.Context) {
	id := c.Param("id")
	var req CreatePhraseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	phrase, err := h.phraseService.GetByID(c.Request.Context(), parseUint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "phrase not found"})
		return
	}

	variantsJSON, _ := json.Marshal(req.Variants)
	tagsJSON, _ := json.Marshal(req.Tags)

	phrase.Text = req.Text
	phrase.Variants = string(variantsJSON)
	phrase.Weight = req.Weight
	phrase.Category = req.Category
	phrase.Lang = req.Lang
	phrase.Tags = string(tagsJSON)

	if err := h.phraseService.Update(c.Request.Context(), phrase); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, phrase)
}

func (h *AdminHandler) DeletePhrase(c *gin.Context) {
	id := c.Param("id")
	if err := h.phraseService.Delete(c.Request.Context(), parseUint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.analyticsService.GetCategoryStats(c.Request.Context(), "month")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func parseUint(s string) uint {
	var id uint
	_, _ = fmt.Sscanf(s, "%d", &id)
	return id
}