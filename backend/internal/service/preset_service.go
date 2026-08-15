package service

import (
	"context"
	"encoding/json"
	"errors"
	"math/rand"
	"time"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
)

type PresetService struct {
	presetRepo *repo.PresetRepo
	phraseRepo *repo.PhraseRepo
}

func NewPresetService(presetRepo *repo.PresetRepo, phraseRepo *repo.PhraseRepo) *PresetService {
	return &PresetService{presetRepo: presetRepo, phraseRepo: phraseRepo}
}

func (s *PresetService) GetAll(ctx context.Context) ([]model.CardPreset, error) {
	return s.presetRepo.GetAll(ctx)
}

func (s *PresetService) GetByID(ctx context.Context, id uint) (*model.CardPreset, error) {
	return s.presetRepo.GetByID(ctx, id)
}

func (s *PresetService) Create(ctx context.Context, preset *model.CardPreset) error {
	return s.presetRepo.Create(ctx, preset)
}

func (s *PresetService) Update(ctx context.Context, preset *model.CardPreset) error {
	return s.presetRepo.Update(ctx, preset)
}

func (s *PresetService) Delete(ctx context.Context, id uint) error {
	return s.presetRepo.Delete(ctx, id)
}

func (s *PresetService) GenerateRandom(ctx context.Context, size int, categories []string) (*model.CardPreset, error) {
	var phrases []model.Phrase
	var err error
	if len(categories) > 0 {
		for _, cat := range categories {
			catPhrases, e := s.phraseRepo.GetByCategory(ctx, cat)
			if e != nil {
				return nil, e
			}
			phrases = append(phrases, catPhrases...)
		}
	} else {
		phrases, err = s.phraseRepo.GetAll(ctx)
		if err != nil {
			return nil, err
		}
	}

	if len(phrases) < size*size {
		return nil, ErrNotEnoughPhrases
	}

	// Weighted random selection
	selected := weightedRandomSelect(phrases, size*size)
	phraseIDs := make([]uint, len(selected))
	for i, p := range selected {
		phraseIDs[i] = p.ID
	}

	idsJSON, _ := json.Marshal(phraseIDs)

	preset := &model.CardPreset{
		Name:     "Auto " + time.Now().Format("2006-01-02 15:04"),
		Phrases:  string(idsJSON),
		Size:     size,
		IsPublic: false,
	}
	return preset, s.presetRepo.Create(ctx, preset)
}

var ErrNotEnoughPhrases = errors.New("not enough phrases for card size")

func weightedRandomSelect(phrases []model.Phrase, count int) []model.Phrase {
	// Simple weighted random without replacement
	type weightedPhrase struct {
		phrase model.Phrase
		score  float64
	}
	weighted := make([]weightedPhrase, len(phrases))
	for i, p := range phrases {
		weight := float64(p.Weight)
		if weight <= 0 {
			weight = 1
		}
		weighted[i] = weightedPhrase{
			phrase: p,
			score:  rand.Float64() * weight,
		}
	}
	// Sort by score descending
	for i := 0; i < len(weighted)-1; i++ {
		for j := i + 1; j < len(weighted); j++ {
			if weighted[i].score < weighted[j].score {
				weighted[i], weighted[j] = weighted[j], weighted[i]
			}
		}
	}
	result := make([]model.Phrase, count)
	for i := 0; i < count && i < len(weighted); i++ {
		result[i] = weighted[i].phrase
	}
	return result
}