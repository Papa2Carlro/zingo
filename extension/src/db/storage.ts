import { getDB, getSetting, setSetting } from './idb';
import type { Phrase, BingoCard, GameSession, Settings, AnalyticsEvent } from '../types';

const DEFAULT_SETTINGS: Settings = {
  apiBaseUrl: 'https://api.zingo.example.com',
  anonHash: '',
  speechEnabled: false,
  speechLang: 'ru-RU',
  uiLanguage: 'uk',
  theme: 'dark',
  position: 'right',
  soundEnabled: true,
  autoDetect: true,
  showWeights: true,
  zingoMode: false,
  zingoIntensity: 'medium',
};

export async function initSettings(): Promise<Settings> {
  const settings = await getSetting<Settings>('settings', DEFAULT_SETTINGS);
  if (!settings.anonHash) {
    settings.anonHash = generateAnonHash();
    await setSetting('settings', settings);
  }
  return settings;
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await initSettings();
  const updated = { ...current, ...partial };
  await setSetting('settings', updated);
  return updated;
}

export async function getPhrases(): Promise<Phrase[]> {
  const db = await getDB();
  return db.getAll('phrases');
}

export async function savePhrases(phrases: Phrase[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('phrases', 'readwrite');
  for (const phrase of phrases) {
    await tx.store.put({ ...phrase, syncedAt: Date.now() });
  }
  await tx.done;
}

export async function getCards(): Promise<BingoCard[]> {
  const db = await getDB();
  return db.getAll('cards');
}

export async function saveCard(card: BingoCard): Promise<void> {
  const db = await getDB();
  await db.put('cards', card);
}

export async function getCard(id: string): Promise<BingoCard | undefined> {
  const db = await getDB();
  return db.get('cards', id);
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cards', id);
}

export async function getCurrentSession(): Promise<GameSession | undefined> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('sessions', 'by-card', '');
  return sessions.find(s => !s.completedAt);
}

export async function saveSession(session: GameSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function addPendingEvent(event: AnalyticsEvent): Promise<void> {
  const db = await getDB();
  await db.put('pendingEvents', {
    id: crypto.randomUUID(),
    ...event,
    retries: 0,
  });
}

export async function getPendingEvents(): Promise<AnalyticsEvent[]> {
  const db = await getDB();
  return db.getAll('pendingEvents');
}

export async function removePendingEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingEvents', id);
}

export async function incrementPendingRetries(id: string): Promise<void> {
  const db = await getDB();
  const event = await db.get('pendingEvents', id);
  if (event) {
    event.retries++;
    await db.put('pendingEvents', event);
  }
}

function generateAnonHash(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.fillText('zingo', 10, 10);
  const fingerprint = canvas.toDataURL() + navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash |= 0;
  }
  return 'anon_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}