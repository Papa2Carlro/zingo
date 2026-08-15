package repo

import (
	"context"

	"gorm.io/gorm"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *UserRepo) GetByNickname(ctx context.Context, nickname string) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).Where("nickname = ?", nickname).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) GetByAnonHash(ctx context.Context, anonHash string) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).Where("anon_hash = ?", anonHash).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uint) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) Update(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}