package main

import (
	"context"
	"fmt"
	"os"

	"github.com/Papa2Carlro/zingo/backend/internal/model"
	"github.com/Papa2Carlro/zingo/backend/internal/repo"
	"github.com/Papa2Carlro/zingo/backend/pkg/config"
	"github.com/Papa2Carlro/zingo/backend/pkg/db"
	"github.com/Papa2Carlro/zingo/backend/pkg/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Config error: %v\n", err)
		os.Exit(1)
	}

	logger.Init(cfg.Log.Level, cfg.Log.Format)

	database, err := db.New(cfg.Database.DSN())
	if err != nil {
		fmt.Fprintf(os.Stderr, "DB error: %v\n", err)
		os.Exit(1)
	}

	phraseRepo := repo.NewPhraseRepo(database)

	// Read phrases from docs/PHRASES.md
	phrases := getSeedPhrases()

	if err := phraseRepo.BulkCreate(context.Background(), phrases); err != nil {
		fmt.Fprintf(os.Stderr, "Seed error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Seeded %d phrases\n", len(phrases))
}

func getSeedPhrases() []model.Phrase {
	// This would ideally parse docs/PHRASES.md
	// For now, hardcoded seed data matching PHRASES.md
	return []model.Phrase{
		{Text: "братські народи", Weight: 9, Category: "propaganda", Lang: "ru"},
		{Text: "специальная военная операция", Weight: 10, Category: "propaganda", Lang: "ru"},
		{Text: "мы не начинали войну", Weight: 8, Category: "propaganda", Lang: "ru"},
		{Text: "у вас там нацисты", Weight: 9, Category: "propaganda", Lang: "ru"},
		{Text: "денацификация", Weight: 8, Category: "propaganda", Lang: "ru"},
		{Text: "зачем вы воюете с Россией", Weight: 7, Category: "propaganda", Lang: "ru"},
		{Text: "Украина это не настоящая страна", Weight: 9, Category: "propaganda", Lang: "ru"},
		{Text: "все врут кроме RT", Weight: 7, Category: "propaganda", Lang: "ru"},
		{Text: "США вас использует", Weight: 6, Category: "propaganda", Lang: "ru"},
		{Text: "а где украинский язык", Weight: 5, Category: "meme", Lang: "ru"},
		{Text: "у тебя в Украине сейчас газ есть", Weight: 6, Category: "meme", Lang: "ru"},
		{Text: "скинь фоточки", Weight: 4, Category: "meme", Lang: "ru"},
		{Text: "ты одна", Weight: 4, Category: "meme", Lang: "ru"},
		{Text: "давайте поговорим как друзья", Weight: 5, Category: "meme", Lang: "ru"},
		{Text: "ты симпатичная", Weight: 5, Category: "creepy", Lang: "ru"},
		{Text: "скинь нюдс", Weight: 10, Category: "creepy", Lang: "ru"},
		{Text: "где ты живёшь адрес", Weight: 8, Category: "creepy", Lang: "ru"},
		{Text: "сколько тебе лет 13", Weight: 7, Category: "creepy", Lang: "ru"},
		{Text: "я твой новый друг навечно", Weight: 6, Category: "creepy", Lang: "ru"},
		{Text: "привет", Weight: 1, Category: "standard", Lang: "ru"},
		{Text: "как дела", Weight: 1, Category: "standard", Lang: "ru"},
		{Text: "откуда ты", Weight: 2, Category: "standard", Lang: "ru"},
		{Text: "что делаешь", Weight: 1, Category: "standard", Lang: "ru"},
		{Text: "сколько тебе лет", Weight: 3, Category: "standard", Lang: "ru"},
	}
}