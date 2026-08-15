package model

import (
	"time"

	"gorm.io/gorm"
)

type Phrase struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Text     string `gorm:"not null;uniqueIndex:idx_phrase_text" json:"text"`
	Variants string `gorm:"type:text" json:"variants,omitempty"` // JSON array
	Weight   int    `gorm:"not null;default:1" json:"weight"`
	Category string `gorm:"not null;index" json:"category"`
	Lang     string `gorm:"not null;default:'ru'" json:"lang"`
	Tags     string `gorm:"type:text" json:"tags,omitempty"` // JSON array
}

func (Phrase) TableName() string {
	return "phrases"
}

type Event struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`

	PhraseID  uint   `gorm:"not null;index" json:"phrase_id"`
	Category  string `gorm:"not null;index" json:"category"`
	Platform  string `gorm:"not null;index" json:"platform"`
	AnonHash  string `gorm:"not null;index" json:"anon_hash"`
	UserID    *uint  `gorm:"index" json:"user_id,omitempty"`
}

func (Event) TableName() string {
	return "events"
}

type CardPreset struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name    string `gorm:"not null" json:"name"`
	Phrases string `gorm:"type:text;not null" json:"phrases"` // JSON array of phrase IDs
	Size    int    `gorm:"not null;default:5" json:"size"`
	IsPublic bool  `gorm:"default:true" json:"is_public"`
}

func (CardPreset) TableName() string {
	return "card_presets"
}

type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Nickname     string `gorm:"not null;uniqueIndex" json:"nickname"`
	PasswordHash string `gorm:"not null" json:"-"`
	Email        string `gorm:"uniqueIndex" json:"email,omitempty"`
	AnonHash     string `gorm:"not null;uniqueIndex" json:"anon_hash"`
	IsAdmin      bool   `gorm:"default:false" json:"is_admin"`
}

func (User) TableName() string {
	return "users"
}

type DailyPhraseStat struct {
	Date       time.Time `gorm:"primaryKey;type:date" json:"date"`
	PhraseID   uint      `gorm:"primaryKey" json:"phrase_id"`
	Category   string    `gorm:"primaryKey" json:"category"`
	Count      int64     `json:"count"`
	UniqueUsers int64    `json:"unique_users"`
}

func (DailyPhraseStat) TableName() string {
	return "daily_phrase_stats"
}