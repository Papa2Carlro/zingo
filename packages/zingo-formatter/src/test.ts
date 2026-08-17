import { formatText } from './formatter.js';

const tests = [
  "Где вы были 8 лет?",
  "Почему вы так думаете?",
  "Я не знаю что сказать",
  "Это очень хороший билет",
  "Мы выиграли джекпот в зинго!",
  "Обычно я играю в бинго по выходным",
  "Кто знает ответ на этот вопрос?",
  "Деньги не важны, главное участие",
  "Привет, как дела? Давно не виделись!",
  "Если хочешь выиграть, нужно рисковать",
  "Мой друг сказал, что он угадал все числа",
  "Это нечестно! Почему я проиграл?",
  "В следующий раз точно повезёт",
  "Зинго — лучшая игра в мире",
  "Купил 5 билетов, ни одного не выиграл",
];

console.log('=== ZINGO FORMATTER TESTS ===\n');

const intensities: Array<'light' | 'medium' | 'hardcore'> = ['light', 'medium', 'hardcore'];

for (const test of tests) {
  console.log(`ORIGINAL: ${test}`);
  for (const intensity of intensities) {
    const result = formatText(test, { intensity, seed: 42 });
    console.log(`${intensity.toUpperCase().padEnd(9)}: ${result}`);
  }
  console.log('---');
}

// Test deterministic output
console.log('\n=== DETERMINISTIC TEST (same seed) ===');
const testText = "Где вы были 8 лет? Почему вы так думаете?";
for (let i = 0; i < 3; i++) {
  console.log(`Run ${i + 1}: ${formatText(testText, { intensity: 'medium', seed: 12345 })}`);
}

console.log('\n=== DIFFERENT SEEDS ===');
for (let i = 0; i < 3; i++) {
  console.log(`Seed ${i}: ${formatText(testText, { intensity: 'medium', seed: i })}`);
}