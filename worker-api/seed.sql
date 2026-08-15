-- Seed phrases from PHRASES.md
INSERT OR REPLACE INTO phrases (text, weight, category, lang) VALUES
-- Propaganda
('братські народи', 9, 'propaganda', 'ru'),
('специальная военная операция', 10, 'propaganda', 'ru'),
('мы не начинали войну', 8, 'propaganda', 'ru'),
('у вас там нацисты', 9, 'propaganda', 'ru'),
('денацификация', 8, 'propaganda', 'ru'),
('зачем вы воюете с россией', 7, 'propaganda', 'ru'),
('украина это не настоящая страна', 9, 'propaganda', 'ru'),
('все врут кроме rt', 7, 'propaganda', 'ru'),
('сша вас использует', 6, 'propaganda', 'ru'),
('а где вы были 8 лет', 8, 'propaganda', 'ru'),
-- Meme
('а где украинский язык', 5, 'meme', 'ru'),
('у тебя в украине сейчас газ есть', 6, 'meme', 'ru'),
('скинь фоточки', 4, 'meme', 'ru'),
('ты одна', 4, 'meme', 'ru'),
('давайте поговорим как друзья', 5, 'meme', 'ru'),
-- Creepy
('ты симпатичная', 5, 'creepy', 'ru'),
('скинь нюдс', 10, 'creepy', 'ru'),
('где ты живёшь адрес', 8, 'creepy', 'ru'),
('сколько тебе лет 13', 7, 'creepy', 'ru'),
('я твой новый друг навечно', 6, 'creepy', 'ru'),
-- Standard
('привет', 1, 'standard', 'ru'),
('как дела', 1, 'standard', 'ru'),
('откуда ты', 2, 'standard', 'ru'),
('что делаешь', 1, 'standard', 'ru'),
('сколько тебе лет', 3, 'standard', 'ru');