package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Papa2Carlro/zingo/backend/internal/service"
)

type PhraseHandler struct {
	phraseService *service.PhraseService
}

func NewPhraseHandler(phraseService *service.PhraseService) *PhraseHandler {
	return &PhraseHandler{phraseService: phraseService}
}

func (h *PhraseHandler) GetAll(c *gin.Context) {
	phrases, err := h.phraseService.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, phrases)
}

func (h *PhraseHandler) GetByCategory(c *gin.Context) {
	category := c.Param("category")
	phrases, err := h.phraseService.GetByCategory(c.Request.Context(), category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, phrases)
}