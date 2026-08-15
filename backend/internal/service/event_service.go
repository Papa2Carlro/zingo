package service

import (
	"context"
	"time"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
)

type EventService struct {
	eventRepo *repo.EventRepo
}

func NewEventService(eventRepo *repo.EventRepo) *EventService {
	return &EventService{eventRepo: eventRepo}
}

func (s *EventService) Ingest(ctx context.Context, event *model.Event) error {
	return s.eventRepo.Create(ctx, event)
}

func (s *EventService) GetStatsByCategory(ctx context.Context, since time.Time) (map[string]int64, error) {
	return s.eventRepo.GetStatsByCategory(ctx, since)
}

func (s *EventService) GetTopPhrases(ctx context.Context, since time.Time, limit int) ([]repo.PhraseStat, error) {
	return s.eventRepo.GetTopPhrases(ctx, since, limit)
}

func (s *EventService) GetUserHistory(ctx context.Context, anonHash string, limit int) ([]model.Event, error) {
	return s.eventRepo.GetByAnonHash(ctx, anonHash, limit)
}