package repo

import (
	"context"
	"encoding/json"

	"gorm.io/gorm"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
)

type PhraseRepo struct {
	db *gorm.DB
}

func NewPhraseRepo(db *gorm.DB) *PhraseRepo {
	return &PhraseRepo{db: db}
}

func (r *PhraseRepo) GetAll(ctx context.Context) ([]model.Phrase, error) {
	var phrases []model.Phrase
	err := r.db.WithContext(ctx).Order("weight DESC, category").Find(&phrases).Error
	return phrases, err
}

func (r *PhraseRepo) GetByCategory(ctx context.Context, category string) ([]model.Phrase, error) {
	var phrases []model.Phrase
	err := r.db.WithContext(ctx).Where("category = ?", category).Order("weight DESC").Find(&phrases).Error
	return phrases, err
}

func (r *PhraseRepo) GetByID(ctx context.Context, id uint) (*model.Phrase, error) {
	var phrase model.Phrase
	err := r.db.WithContext(ctx).First(&phrase, id).Error
	if err != nil {
		return nil, err
	}
	return &phrase, nil
}

func (r *PhraseRepo) Create(ctx context.Context, phrase *model.Phrase) error {
	return r.db.WithContext(ctx).Create(phrase).Error
}

func (r *PhraseRepo) Update(ctx context.Context, phrase *model.Phrase) error {
	return r.db.WithContext(ctx).Save(phrase).Error
}

func (r *PhraseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Phrase{}, id).Error
}

func (r *PhraseRepo) BulkCreate(ctx context.Context, phrases []model.Phrase) error {
	return r.db.WithContext(ctx).Create(&phrases).Error
}

func (r *PhraseRepo) GetVariants(ctx context.Context, id uint) ([]string, error) {
	var phrase model.Phrase
	err := r.db.WithContext(ctx).Select("variants").First(&phrase, id).Error
	if err != nil {
		return nil, err
	}
	if phrase.Variants == "" {
		return []string{}, nil
	}
	var variants []string
	err = json.Unmarshal([]byte(phrase.Variants), &variants)
	return variants, err
}