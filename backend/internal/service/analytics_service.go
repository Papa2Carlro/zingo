package service

import (
	"context"
	"time"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
)

type AnalyticsService struct {
	eventRepo *repo.EventRepo
}

func NewAnalyticsService(eventRepo *repo.EventRepo) *AnalyticsService {
	return &AnalyticsService{eventRepo: eventRepo}
}

func (s *AnalyticsService) GetTopPhrases(ctx context.Context, period string, limit int) ([]repo.PhraseStat, error) {
	since := getSince(period)
	return s.eventRepo.GetTopPhrases(ctx, since, limit)
}

func (s *AnalyticsService) GetCategoryStats(ctx context.Context, period string) (map[string]int64, error) {
	since := getSince(period)
	return s.eventRepo.GetStatsByCategory(ctx, since)
}

func (s *AnalyticsService) GetTrends(ctx context.Context, period string) ([]TrendPoint, error) {
	since := getSince(period)
	// Simplified: daily counts for last N days
	type Result struct {
		Date  time.Time
		Count int64
	}
	var results []Result
	err := s.eventRepo.GetDB().WithContext(ctx).
		Model(&model.Event{}).
		Select("DATE(created_at) as date, count(*) as count").
		Where("created_at >= ?", since).
		Group("DATE(created_at)").
		Order("date").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}
	trends := make([]TrendPoint, len(results))
	for i, r := range results {
		trends[i] = TrendPoint{Date: r.Date, Count: r.Count}
	}
	return trends, nil
}

type TrendPoint struct {
	Date  time.Time `json:"date"`
	Count int64     `json:"count"`
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