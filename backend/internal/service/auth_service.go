package service

import (
	"context"
	"errors"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
	"github.com/Papa2Carlro/zingo/backend/pkg/config"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrUserExists = errors.New("user already exists")

type AuthService struct {
	userRepo *repo.UserRepo
	cfg      *config.Config
}

func NewAuthService(userRepo *repo.UserRepo, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg}
}

func (s *AuthService) Register(ctx context.Context, nickname, password, email string) (*model.User, string, error) {
	existing, _ := s.userRepo.GetByNickname(ctx, nickname)
	if existing != nil {
		return nil, "", ErrUserExists
	}

	hash, err := argon2id.CreateHash(password, argon2id.DefaultParams)
	if err != nil {
		return nil, "", err
	}

	user := &model.User{
		Nickname:     nickname,
		PasswordHash: hash,
		Email:        email,
		AnonHash:     generateAnonHash(nickname),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, "", err
	}

	token, err := s.generateToken(user)
	return user, token, err
}

func (s *AuthService) Login(ctx context.Context, nickname, password string) (*model.User, string, error) {
	user, err := s.userRepo.GetByNickname(ctx, nickname)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	match, err := argon2id.ComparePasswordAndHash(password, user.PasswordHash)
	if err != nil || !match {
		return nil, "", ErrInvalidCredentials
	}

	token, err := s.generateToken(user)
	return user, token, err
}

func (s *AuthService) GetByID(ctx context.Context, id uint) (*model.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

func (s *AuthService) GetByAnonHash(ctx context.Context, anonHash string) (*model.User, error) {
	return s.userRepo.GetByAnonHash(ctx, anonHash)
}

func (s *AuthService) generateToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"nick":    user.Nickname,
		"exp":     time.Now().Add(time.Duration(s.cfg.JWT.ExpiryHours) * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.Secret))
}

func (s *AuthService) ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.cfg.JWT.Secret), nil
	})
}

func generateAnonHash(nickname string) string {
	// Simple hash for demo; in production use crypto/sha256
	return "anon_" + nickname
}