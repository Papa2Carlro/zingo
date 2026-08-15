package repo

import (
	"context"
	"time"

	"gorm.io/gorm"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
)

type EventRepo struct {
	db *gorm.DB
}

func NewEventRepo(db *gorm.DB) *EventRepo {
	return &EventRepo{db: db}
}

func (r *EventRepo) GetDB() *gorm.DB {
	return r.db
}

func (r *EventRepo) Create(ctx context.Context, event *model.Event) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *EventRepo) GetByAnonHash(ctx context.Context, anonHash string, limit int) ([]model.Event, error) {
	var events []model.Event
	err := r.db.WithContext(ctx).
		Where("anon_hash = ?", anonHash).
		Order("created_at DESC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

func (r *EventRepo) GetStatsByCategory(ctx context.Context, since time.Time) (map[string]int64, error) {
	type Result struct {
		Category string
		Count    int64
	}
	var results []Result
	err := r.db.WithContext(ctx).
		Model(&model.Event{}).
		Select("category, count(*) as count").
		Where("created_at >= ?", since).
		Group("category").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.Category] = r.Count
	}
	return stats, nil
}

func (r *EventRepo) GetTopPhrases(ctx context.Context, since time.Time, limit int) ([]model.PhraseStat, error) {
	type Result struct {
		PhraseID uint
		Category string
		Count    int64
	}
	var results []Result
	err := r.db.WithContext(ctx).
		Model(&model.Event{}).
		Select("phrase_id, category, count(*) as count").
		Where("created_at >= ?", since).
		Group("phrase_id, category").
		Order("count DESC").
		Limit(limit).
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	stats := make([]model.PhraseStat, len(results))
	for i, r := range results {
		stats[i] = model.PhraseStat{
			PhraseID: r.PhraseID,
			Category: r.Category,
			Count:    r.Count,
		}
	}
	return stats, nil
}

type PhraseStat struct {
	PhraseID uint
	Category string
	Count    int64
}