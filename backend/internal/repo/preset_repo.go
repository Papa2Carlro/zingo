package repo

import (
	"context"

	"gorm.io/gorm"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
)

type PresetRepo struct {
	db *gorm.DB
}

func NewPresetRepo(db *gorm.DB) *PresetRepo {
	return &PresetRepo{db: db}
}

func (r *PresetRepo) GetAll(ctx context.Context) ([]model.CardPreset, error) {
	var presets []model.CardPreset
	err := r.db.WithContext(ctx).Where("is_public = ?", true).Order("created_at DESC").Find(&presets).Error
	return presets, err
}

func (r *PresetRepo) GetByID(ctx context.Context, id uint) (*model.CardPreset, error) {
	var preset model.CardPreset
	err := r.db.WithContext(ctx).First(&preset, id).Error
	if err != nil {
		return nil, err
	}
	return &preset, nil
}

func (r *PresetRepo) Create(ctx context.Context, preset *model.CardPreset) error {
	return r.db.WithContext(ctx).Create(preset).Error
}

func (r *PresetRepo) Update(ctx context.Context, preset *model.CardPreset) error {
	return r.db.WithContext(ctx).Save(preset).Error
}

func (r *PresetRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.CardPreset{}, id).Error
}