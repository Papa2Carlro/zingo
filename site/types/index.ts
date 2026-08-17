export interface Phrase {
  id: string;
  text: string;
  variants?: string[];
  weight: number;
  category: string;
  lang: string;
  tags?: string[];
  hits: number;
  syncedAt?: number;
}

/**
 * Категорії фраз для генерації карток
 */
export type PhraseCategory = 
  | 'war_narrative'        // Наративи про війну/СВО
  | 'delegitimization'     // Делегітимізація України
  | 'denazification'       // Нацизм/денацифікація
  | 'biolabs'              // Біолабораторії
  | 'west_nato'            // Захід/НАТО/США
  | 'history_revisionism'  // Історичний ревізіонізм
  | 'manipulation'         // Маніпуляції/газлайтинг
  | 'disinfo_ua'           // Дезінформація про ЗСУ/Зеленського
  | 'economy'              // Економічні наративи
  | 'values_religion';     // Ціннісні/релігійні

/**
 * База російських пропагандистських фраз для ZINGO
 * 
 * ВАЖЛИВО: Тільки російська пропаганда. Українські патріотичні фрази
 * (Слава ЗСУ, Героям слава, Перемога тощо) НЕ входять до цієї бази.
 * 
 * Вага (1-10) визначає ймовірність вибору при генерації картки.
 */
export const PROPAGANDA_PHRASES: Omit<Phrase, 'hits' | 'syncedAt'>[] = [
  // === 1. Наративи про війну та "СВО" ===
  { id: 'svo', text: 'специальная военная операция', variants: ['спецоперация', 'сво', 'спец. операция'], weight: 10, category: 'war_narrative', lang: 'ru', tags: ['euphemism', 'official'] },
  { id: 'we_not_started_war', text: 'мы не начинали войну', variants: ['мы не атаковали первыми', 'россия не начала войну'], weight: 9, category: 'war_narrative', lang: 'ru', tags: ['denial'] },
  { id: 'not_war_svo', text: 'это не война, это спецоперация', variants: ['не война а спецоперация'], weight: 9, category: 'war_narrative', lang: 'ru', tags: ['euphemism'] },
  { id: 'protect_donbass', text: 'защита донбасса', variants: ['защита жителей донбасса', 'спасение донбасса'], weight: 9, category: 'war_narrative', lang: 'ru', tags: ['protection_narrative'] },
  { id: 'protect_russian_speakers', text: 'защита русскоязычных', variants: ['защита русских', 'права русскоязычных'], weight: 8, category: 'war_narrative', lang: 'ru', tags: ['protection_narrative'] },
  { id: 'preventive_strike', text: 'предотвращение нападения на россию', variants: ['превентивный удар', 'россия защищалась'], weight: 8, category: 'war_narrative', lang: 'ru', tags: ['preventive_war'] },
  { id: 'kyiv_started_war', text: 'киевский режим начал войну', variants: ['украинский режим начал войну'], weight: 8, category: 'war_narrative', lang: 'ru', tags: ['blame_shifting'] },
  { id: 'freeze_conflict', text: 'замораживание конфликта', variants: ['заморозка линии фронта', 'перемирие на текущих линиях'], weight: 7, category: 'war_narrative', lang: 'ru', tags: ['freeze'] },

  // === 2. Делегітимізація України ===
  { id: 'ukraine_not_country', text: 'украина это не страна', variants: ['украина не государство', 'украины не существует'], weight: 10, category: 'delegitimization', lang: 'ru', tags: ['sovereignty_denial'] },
  { id: 'ukraine_artificial', text: 'украина — искусственное образование', variants: ['украина вымышленная страна', 'украина фейк'], weight: 9, category: 'delegitimization', lang: 'ru', tags: ['historical_revisionism'] },
  { id: 'ukraine_created_by_bolsheviks', text: 'украина создана большевиками', variants: ['ленин создал украину', 'украина — подарок большевиков'], weight: 9, category: 'delegitimization', lang: 'ru', tags: ['historical_myth'] },
  { id: 'ukraine_no_history', text: 'украина не имеет истории', variants: ['у украины нет своей истории'], weight: 8, category: 'delegitimization', lang: 'ru', tags: ['stereotype'] },
  { id: 'ukraine_little_russia', text: 'украина — это малая россия', variants: ['украина — юг россии', 'украина часть россии'], weight: 8, category: 'delegitimization', lang: 'ru', tags: ['imperial_narrative'] },
  { id: 'ukraine_cant_exist_without_russia', text: 'украина не может существовать без россии', variants: ['украина обречена без россии'], weight: 8, category: 'delegitimization', lang: 'ru', tags: ['economic_blackmail'] },
  { id: 'ukraine_unviable', text: 'украинское государство нежизнеспособно', variants: ['украина развалится', 'украина распадется'], weight: 7, category: 'delegitimization', lang: 'ru', tags: ['collapse_prediction'] },

  // === 3. Нацизм / Денацифікація ===
  { id: 'ukraine_nazis', text: 'в украине нацисты', variants: ['у вас нацисты', 'киевский нацистский режим'], weight: 10, category: 'denazification', lang: 'ru', tags: ['main_narrative'] },
  { id: 'banderites_in_power', text: 'бандеровцы у власти', variants: ['бандеровцы у власти в киеве', 'последователи бандеры'], weight: 10, category: 'denazification', lang: 'ru', tags: ['oau_upa'] },
  { id: 'denazification', text: 'денацификация украины', variants: ['денацификация', 'цель — денацификация'], weight: 10, category: 'denazification', lang: 'ru', tags: ['official_goal'] },
  { id: 'ukraine_glorifies_nazis', text: 'украина прославляет нацистов', variants: ['украина возводит в героев нацистов', 'улицы названы в честь бандеровцев'], weight: 9, category: 'denazification', lang: 'ru', tags: ['history_politics'] },
  { id: 'azov_terrorists', text: 'азов — террористическая организация', variants: ['азов нацисты', 'азов баталион нацисты'], weight: 9, category: 'denazification', lang: 'ru', tags: ['azov_stigma'] },
  { id: 'ukrainian_nazis_kill_own', text: 'украинские нацисты убивают своих', variants: ['нацисты стреляют в своих', 'украинские нацисты убивают мирных'], weight: 9, category: 'denazification', lang: 'ru', tags: ['own_people'] },
  { id: 'russian_language_ban_nazism', text: 'запрет русского языка = нацизм', variants: ['запрет русского = фашизм', 'языковой закон = нацизм'], weight: 8, category: 'denazification', lang: 'ru', tags: ['language_law'] },

  // === 4. Біолабораторії ===
  { id: 'us_biolabs_ukraine', text: 'американские биолаборатории в украине', variants: ['биолаборатории пентагона', 'американские биолабы'], weight: 9, category: 'biolabs', lang: 'ru', tags: ['fake_biolabs'] },
  { id: 'us_develops_bioweapons', text: 'сша разрабатывают биологическое оружие в украине', variants: ['пентагон создает вирусы в украине'], weight: 9, category: 'biolabs', lang: 'ru', tags: ['conspiracy'] },
  { id: 'bird_flu_from_labs', text: 'птичий грипп / свиной грипп из украинских лаб', variants: ['вирусы из украинских биолаб'], weight: 8, category: 'biolabs', lang: 'ru', tags: ['fear_viruses'] },
  { id: 'ethnic_weapon', text: 'этническое оружие против славян', variants: ['генетическое оружие против русских'], weight: 8, category: 'biolabs', lang: 'ru', tags: ['racist_narrative'] },
  { id: 'covid_from_ukraine_labs', text: 'ковид пришел из украинских лабораторий', variants: ['коронавирус из украинских биолаб'], weight: 7, category: 'biolabs', lang: 'ru', tags: ['covid_disinformation'] },

  // === 5. Захід / НАТО / США ===
  { id: 'nato_expansion', text: 'нато расширяется на восток', variants: ['нато нарушило обещания', 'расширение нато на восток'], weight: 9, category: 'west_nato', lang: 'ru', tags: ['betrayal_narrative'] },
  { id: 'us_uses_ukraine', text: 'сша используют украину как орудие', variants: ['украина — прокси сша', 'украина — пешка сша'], weight: 9, category: 'west_nato', lang: 'ru', tags: ['proxy_war'] },
  { id: 'west_fights_to_last_ukrainian', text: 'запад воюет до последнего украинца', variants: ['до последнего украинца', 'запад сражается за нами'], weight: 9, category: 'west_nato', lang: 'ru', tags: ['exploitation'] },
  { id: 'us_controls_kyiv', text: 'сша контролируют киев', variants: ['киев — марионетка сша', 'зелений — агент цру'], weight: 8, category: 'west_nato', lang: 'ru', tags: ['puppet'] },
  { id: 'nato_prepared_attack', text: 'нато готовило нападение на россию', variants: ['нато готовило удар по россии'], weight: 8, category: 'west_nato', lang: 'ru', tags: ['imminent_threat'] },
  { id: 'west_wants_russia_breakup', text: 'запад хочет разорвать россию', variants: ['цель закола — распад россии', 'бальканизация россии'], weight: 8, category: 'west_nato', lang: 'ru', tags: ['existential_threat'] },
  { id: 'sanctions_dont_work', text: 'санкции не работают / бьют по заладу', variants: ['санкции бесполезны', 'санкции ударяют по европе'], weight: 7, category: 'west_nato', lang: 'ru', tags: ['economic'] },

  // === 6. Історичні міфи ===
  { id: 'crimea_always_russian', text: 'крым всегда был русским', variants: ['крым — это россия', 'крым наш'], weight: 9, category: 'history_revisionism', lang: 'ru', tags: ['annexation'] },
  { id: 'crimea_referendum_legal', text: 'крымский референдум был легальным', variants: ['крым голосовал за россию', 'воля народа'], weight: 8, category: 'history_revisionism', lang: 'ru', tags: ['legitimization'] },
  { id: 'khrushchev_gave_crimea', text: 'хрущев незаконно отдал крым украине', variants: ['хрущев подарил крым', 'хрущев ошибся'], weight: 8, category: 'history_revisionism', lang: 'ru', tags: ['historical_myth'] },
  { id: 'ww2_started_1941', text: 'великая отечественная война началась 22 июня 1941', variants: ['война началась 22 июня', 'молотов-риббентроп не считается'], weight: 7, category: 'history_revisionism', lang: 'ru', tags: ['molotov_ribbentrop_erasure'] },
  { id: 'poland_blame_ww2', text: 'польша виновата во второй мировой', variants: ['польша провоцировала войну', 'польша — гиена европы'], weight: 7, category: 'history_revisionism', lang: 'ru', tags: ['blame_shifting'] },
  { id: 'baltics_voluntarily_ussr', text: 'балтийские страны добровольно вошли в ссср', variants: ['балтии сами просили в ссср'], weight: 6, category: 'history_revisionism', lang: 'ru', tags: ['revisionism'] },

  // === 7. Маніпуляції / Газлайтинг ===
  { id: 'you_are_to_blame', text: 'вы сами виноваты', variants: ['сами виноваты', 'виноваты сами'], weight: 8, category: 'manipulation', lang: 'ru', tags: ['victim_blaming'] },
  { id: 'you_dont_want_peace', text: 'вы не хотите мира', variants: ['вы саботируете мир', 'киев не хочет мира'], weight: 8, category: 'manipulation', lang: 'ru', tags: ['blame_shifting'] },
  { id: 'you_believe_western_propaganda', text: 'вы верите западной пропаганде', variants: ['вы замылены', 'вы смотрите только цнн'], weight: 8, category: 'manipulation', lang: 'ru', tags: ['source_attack'] },
  { id: 'truth_in_middle', text: 'правда где-то посередине', variants: ['истина посередине', 'обе стороны виноваты'], weight: 7, category: 'manipulation', lang: 'ru', tags: ['false_balance'] },
  { id: 'who_benefits', text: 'кто выиграет от этой войны?', variants: ['кому выгодна война', 'следуй за деньгами'], weight: 7, category: 'manipulation', lang: 'ru', tags: ['cui_bono'] },
  { id: 'why_this_war', text: 'зачем вам эта война?', variants: ['зачем вы это делаете', 'ради чего вы умираете'], weight: 7, category: 'manipulation', lang: 'ru', tags: ['demoralization'] },
  { id: 'russia_eternal', text: 'россия вечна / россия не проиграет', variants: ['россия непобедима', 'история на нашей стороне'], weight: 7, category: 'manipulation', lang: 'ru', tags: ['messianism'] },

  // === 8. Дезінформація про ЗСУ / Зеленського ===
  { id: 'zelensky_drug_addict', text: 'зелений — наркоман / наркотуп', variants: ['зелений под наркотиками', 'кокаин зелений'], weight: 9, category: 'disinfo_ua', lang: 'ru', tags: ['personal_attack'] },
  { id: 'zelensky_dictator', text: 'зелений диктатор / у зеления нет легитимности', variants: ['зелений узаконник', 'срок зеления истек'], weight: 9, category: 'disinfo_ua', lang: 'ru', tags: ['delegitimization'] },
  { id: 'ua_surrender_mass', text: 'украинские военные сдаются массово', variants: ['всу сдаются', 'массовое сдача в плен'], weight: 8, category: 'disinfo_ua', lang: 'ru', tags: ['front_disinformation'] },
  { id: 'ua_strikes_own', text: 'украинские военные наносят удары по своим', variants: ['украина бьет по своим городам', 'всу ударяет по мирным'], weight: 8, category: 'disinfo_ua', lang: 'ru', tags: ['own_cities'] },
  { id: 'front_collapse', text: 'завал на фронте / фронт рушится', variants: ['фронт трещит', 'украинская армия разбежалась'], weight: 8, category: 'disinfo_ua', lang: 'ru', tags: ['psyop'] },
  { id: 'mobilization_failed', text: 'мобилизация в украине провалилась', variants: ['никто не хочет воевать', 'мужчины бегут'], weight: 7, category: 'disinfo_ua', lang: 'ru', tags: ['demoralization'] },

  // === 9. Економічні наративи ===
  { id: 'russia_economy_holds', text: 'российская экономика выдерживает', variants: ['экономика россии крепче', 'санкции не работают'], weight: 7, category: 'economy', lang: 'ru', tags: ['resilience'] },
  { id: 'gas_weapon', text: 'газ / нефть — оружие россии', variants: ['энергетическое оружие', 'россия отключит газ'], weight: 6, category: 'economy', lang: 'ru', tags: ['energy_weapon'] },
  { id: 'europe_freezes', text: 'европа замерзнет без российского газа', variants: ['европа замерзнет зимой', 'немецкая промышленность рухнет'], weight: 6, category: 'economy', lang: 'ru', tags: ['energy_crisis'] },
  { id: 'dollar_collapse', text: 'доллар рухнет / рубль укрепится', variants: ['рубль — самая сильная валюта'], weight: 5, category: 'economy', lang: 'ru', tags: ['currency'] },

  // === 10. Ціннісні / Релігійні ===
  { id: 'traditional_values', text: 'защита традиционных ценностей', variants: ['традиции, семья, вера — это наша сила'], weight: 7, category: 'values_religion', lang: 'ru', tags: ['culture_war'] },
  { id: 'west_rots', text: 'запад гниет / либерализм — это зло', variants: ['гейропа', 'запад разлагается'], weight: 6, category: 'values_religion', lang: 'ru', tags: ['anti_west'] },
  { id: 'russian_orthodox_bastion', text: 'русская православная церковь — оплот', variants: ['пцр — нравственный компас'], weight: 6, category: 'values_religion', lang: 'ru', tags: ['clericalization'] },
  { id: 'satanism_west', text: 'сатанизм на западе / сатанисты у власти', variants: ['сатанисты в киеве', 'сатанизм в ес'], weight: 5, category: 'values_religion', lang: 'ru', tags: ['conspiracy'] },
];

export interface BingoCard {
  id: string;
  name: string;
  size: { x: number; y: number };
  phrases: string[]; // phrase IDs
  isPreset: boolean;
  createdAt: number;
}

export interface GameSession {
  id: string;
  cardId: string;
  marked: Record<string, number>; // phraseId -> timestamp
  startedAt: number;
  completedAt?: number;
  platform: string;
  bingoLines?: string[];
}

export interface Settings {
  apiBaseUrl: string;
  apiKey?: string;
  anonHash: string;
  userId?: string;
  jwtToken?: string;
  speechEnabled: boolean;
  speechLang: string;
  uiLanguage: 'uk' | 'ru' | 'en';
  theme: 'dark' | 'light';
  position: 'right' | 'left' | 'bottom';
  soundEnabled: boolean;
  autoDetect: boolean;
  showWeights: boolean;
  zingoMode: boolean;
  zingoIntensity: 'light' | 'medium' | 'hardcore';
}

export interface AnalyticsEvent {
  id?: string;
  phraseId: string;
  category: string;
  platform: string;
  anonHash: string;
  userId?: string;
  timestamp: number;
  source: 'manual' | 'speech' | 'text';
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  bingos: number;
  gamesPlayed: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}