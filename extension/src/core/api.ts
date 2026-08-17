import { getSetting } from '../db/idb';
import type { AnalyticsEvent, ApiResponse, Phrase, BingoCard, LeaderboardEntry, Settings } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:8080';

async function getBaseUrl(): Promise<string> {
  const defaultSettings: Settings = {
    apiBaseUrl: DEFAULT_BASE_URL,
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
  return (await getSetting('settings', defaultSettings)).apiBaseUrl;
}

async function getHeaders(): Promise<HeadersInit> {
  const defaultSettings: Settings = {
    apiBaseUrl: DEFAULT_BASE_URL,
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
  const settings = await getSetting('settings', defaultSettings);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Anon-Hash': settings.anonHash,
  };
  if (settings.apiKey) {
    headers['X-API-Key'] = settings.apiKey;
  }
  if (settings.jwtToken) {
    headers['Authorization'] = `Bearer ${settings.jwtToken}`;
  }
  return headers;
}

export async function fetchPhrases(): Promise<Phrase[]> {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/phrases`, { headers });
  if (!res.ok) throw new Error('Failed to fetch phrases');
  const data = await res.json();
  return data as Phrase[];
}

export async function fetchAnalyticsTop(period = 'week', limit = 20) {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/analytics/top?period=${period}&limit=${limit}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/analytics/leaderboard`, { headers });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function sendEvent(event: AnalyticsEvent): Promise<void> {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to send event');
  }
}

export async function registerUser(nickname: string, password: string, email?: string) {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nickname, password, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(nickname: string, password: string) {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nickname, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function fetchPresets(): Promise<BingoCard[]> {
  const baseUrl = await getBaseUrl();
  const headers = await getHeaders();
  const res = await fetch(`${baseUrl}/api/v1/presets`, { headers });
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}