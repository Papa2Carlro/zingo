package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
)

type PhraseService struct {
	phraseRepo *repo.PhraseRepo
	eventRepo  *repo.EventRepo
}

func NewPhraseService(phraseRepo *repo.PhraseRepo, eventRepo *repo.EventRepo) *PhraseService {
	return &PhraseService{phraseRepo: phraseRepo, eventRepo: eventRepo}
}

func (s *PhraseService) GetAll(ctx context.Context) ([]model.Phrase, error) {
	return s.phraseRepo.GetAll(ctx)
}

func (s *PhraseService) GetByCategory(ctx context.Context, category string) ([]model.Phrase, error) {
	return s.phraseRepo.GetByCategory(ctx, category)
}

func (s *PhraseService) GetWithStats(ctx context.Context, since time.Time) ([]PhraseWithStats, error) {
	phrases, err := s.phraseRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	stats, err := s.eventRepo.GetTopPhrases(ctx, since, 100)
	if err != nil {
		return nil, err
	}

	statMap := make(map[uint]int64)
	for _, st := range stats {
		statMap[st.PhraseID] = st.Count
	}

	result := make([]PhraseWithStats, len(phrases))
	for i, p := range phrases {
		variants := []string{}
		if p.Variants != "" {
			_ = json.Unmarshal([]byte(p.Variants), &variants)
		}
		tags := []string{}
		if p.Tags != "" {
			_ = json.Unmarshal([]byte(p.Tags), &tags)
		}
		result[i] = PhraseWithStats{
			Phrase: p,
			Hits:   statMap[p.ID],
			Variants: variants,
			Tags: tags,
		}
	}
	return result, nil
}

type PhraseWithStats struct {
	model.Phrase
	Hits     int64      `json:"hits"`
	Variants []string   `json:"variants"`
	Tags     []string   `json:"tags"`
}

func (s *PhraseService) Create(ctx context.Context, phrase *model.Phrase) error {
	return s.phraseRepo.Create(ctx, phrase)
}

func (s *PhraseService) Update(ctx context.Context, phrase *model.Phrase) error {
	return s.phraseRepo.Update(ctx, phrase)
}

func (s *PhraseService) Delete(ctx context.Context, id uint) error {
	return s.phraseRepo.Delete(ctx, id)
}

func (s *PhraseService) BulkCreate(ctx context.Context, phrases []model.Phrase) error {
	return s.phraseRepo.BulkCreate(ctx, phrases)
}