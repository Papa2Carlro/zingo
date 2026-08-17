import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initSettings, updateSettings, getSetting, getPhrases, getCurrentSession, saveSession } from '@/db/storage';
import { fetchPhrases, fetchAnalyticsTop, fetchLeaderboard, registerUser, loginUser, sendEvent } from '@/core/api';
import { initI18n, t, changeLanguage } from '@/i18n';
import type { Settings, Phrase, GameSession } from '@/types';

interface PopupState {
  settings: Settings | null;
  currentTab: 'stats' | 'leaderboard' | 'settings';
  authMode: 'login' | 'register' | null;
  topPhrases: any[];
  categories: Record<string, number>;
  leaderboard: any[];
  sessionStats: { marked: number; bingoLines: number; platform: string } | null;
  loading: boolean;
}

function Popup() {
  const [state, setState] = useState<PopupState>({
    settings: null,
    currentTab: 'stats',
    authMode: null,
    topPhrases: [],
    categories: {},
    leaderboard: [],
    sessionStats: null,
    loading: true,
  });

  // Initialize on mount
  useEffect(() => {
    async function initialize() {
      const settings = await initSettings();
      await initI18n(settings.uiLanguage);

      setState(prev => ({ ...prev, settings, loading: false }));

      await loadStats();
      await loadLeaderboard();
    }
    initialize();
  }, []);

  const loadStats = async () => {
    try {
      const [top, categoriesData] = await Promise.all([
        fetchAnalyticsTop('week', 10),
        fetchAnalyticsTop('week', 100),
      ]);

      const catMap: Record<string, number> = {};
      (categoriesData as any[]).forEach(p => {
        catMap[p.category] = (catMap[p.category] || 0) + p.count;
      });

      const session = await getCurrentSession();
      let sessionStats = null;
      if (session) {
        const marked = Object.keys(session.marked).length;
        sessionStats = {
          marked,
          bingoLines: session.bingoLines?.length || 0,
          platform: session.platform,
        };
      }

      setState(prev => ({
        ...prev,
        topPhrases: (top as any[]).slice(0, 5),
        categories: catMap,
        sessionStats,
      }));
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await fetchLeaderboard();
      setState(prev => ({ ...prev, leaderboard: (data as any[]).slice(0, 10) }));
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
    }
  };

  const updateSetting = async (key: keyof Settings, value: unknown) => {
    const newSettings = await updateSettings({ [key]: value } as Partial<Settings>);
    setState(prev => ({ ...prev, settings: newSettings }));

    if (key === 'uiLanguage') {
      await changeLanguage(value as 'uk' | 'ru' | 'en');
    }

    // Notify content script
    chrome.runtime.sendMessage({ type: 'settings-updated', settings: newSettings }).catch(() => { });
  };

  const handleNewGame = () => {
    chrome.runtime.sendMessage({ type: 'new-game' }).catch(() => { });
    window.close();
  };

  const handleContinueGame = () => {
    chrome.runtime.sendMessage({ type: 'continue-game' }).catch(() => { });
    window.close();
  };

  const showAuthForm = (mode: 'login' | 'register') => {
    setState(prev => ({ ...prev, authMode: mode }));
  };

  const hideAuthForm = () => {
    setState(prev => ({ ...prev, authMode: null }));
  };

  const submitAuth = async () => {
    const nicknameInput = document.getElementById('auth-nickname') as HTMLInputElement;
    const passwordInput = document.getElementById('auth-password') as HTMLInputElement;
    const emailInput = document.getElementById('auth-email') as HTMLInputElement;

    const nickname = nicknameInput?.value.trim();
    const password = passwordInput?.value;
    const email = emailInput?.value.trim();

    if (!nickname || !password) return;

    try {
      let data;
      if (state.authMode === 'register') {
        data = await registerUser(nickname, password, email || undefined);
      } else {
        data = await loginUser(nickname, password);
      }

      await updateSettings({
        userId: String(data.user.id),
        jwtToken: data.token,
      });

      hideAuthForm();
      await loadStats();
      await loadLeaderboard();

      // Refresh settings to get updated userId/jwtToken
      const newSettings = await initSettings();
      setState(prev => ({ ...prev, settings: newSettings }));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const exportData = async () => {
    const phrases = await getPhrases();
    const session = await getCurrentSession();
    const cards = await getSetting('cards', []);
    const data = { phrases, session, cards, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zingo-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.phrases) {
          const { savePhrases } = await import('@/db/storage');
          await savePhrases(data.phrases);
        }
        if (data.session) {
          const { saveSession } = await import('@/db/storage');
          await saveSession(data.session);
        }
        alert(t('importSuccess'));
      } catch {
        alert(t('error'));
      }
    };
    input.click();
  };

  const syncPhrases = async () => {
    try {
      const phrases = await fetchPhrases();
      const { savePhrases } = await import('@/db/storage');
      await savePhrases(phrases);
      const newSettings = await updateSettings({});
      setState(prev => ({ ...prev, settings: newSettings }));
      alert(t('exportSuccess'));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (state.loading) {
    return (
      <div className="container" style={{ padding: '16px', textAlign: 'center' }}>
        <h1 style={{ color: '#e94560' }}>ZINGO</h1>
        <div>Завантаження...</div>
      </div>
    );
  }

  const { settings, currentTab, authMode, topPhrases, categories, leaderboard, sessionStats } = state;

  return (
    <div className="container">
      <h1>ZINGO</h1>

      <div className="section">
        <div className="section-title">Гра</div>
        <div className="btn-row">
          <button className="btn primary" id="new-game" onClick={handleNewGame}>Нова гра</button>
          <button className="btn" id="continue-game" onClick={handleContinueGame}>Продовжити</button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Статистика сесії</div>
        <div className="stat-row"><span className="stat-label">Відмічено</span><span className="stat-value" id="stat-marked">{sessionStats ? `${sessionStats.marked} / 25` : '0 / 25'}</span></div>
        <div className="stat-row"><span className="stat-label">Бінго</span><span className="stat-value" id="stat-bingo">{sessionStats?.bingoLines || 0}</span></div>
        <div className="stat-row"><span className="stat-label">Платформа</span><span className="stat-value" id="stat-platform">{sessionStats?.platform || '-'}</span></div>
      </div>

      <div className="tabs">
        <button className={`tab ${currentTab === 'stats' ? 'active' : ''}`} data-tab="stats" onClick={() => setState(prev => ({ ...prev, currentTab: 'stats' }))}>Статистика</button>
        <button className={`tab ${currentTab === 'leaderboard' ? 'active' : ''}`} data-tab="leaderboard" onClick={() => setState(prev => ({ ...prev, currentTab: 'leaderboard' }))}>Лідерборд</button>
        <button className={`tab ${currentTab === 'settings' ? 'active' : ''}`} data-tab="settings" onClick={() => setState(prev => ({ ...prev, currentTab: 'settings' }))}>Налаштування</button>
      </div>

      {currentTab === 'stats' && (
        <div id="panel-stats">
          <div className="section">
            <div className="section-title">Топ фраз</div>
            <div id="top-phrases" style={{ fontSize: '12px', color: '#8892b0' }}>
              {topPhrases.length > 0 ? (
                topPhrases.map((p, i) => (
                  <div key={i} style={{ padding: '4px 0' }}>
                    {i + 1}. {p.text || p.phrase_id} — {p.count} {t('hits')}
                  </div>
                ))
              ) : (
                'Немає даних'
              )}
            </div>
          </div>
          <div className="section">
            <div className="section-title">Категорії</div>
            <div id="category-stats" style={{ fontSize: '12px', color: '#8892b0' }}>
              {Object.keys(categories).length > 0 ? (
                Object.entries(categories).map(([cat, count]) => (
                  <div key={cat} style={{ padding: '4px 0' }}>
                    {t(cat)}: {count}
                  </div>
                ))
              ) : (
                'Немає даних'
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'leaderboard' && (
        <div id="panel-leaderboard" className={currentTab !== 'leaderboard' ? 'hidden' : ''}>
          <div className="leaderboard" id="leaderboard-list">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, i) => (
                <div key={i} className="leaderboard-item">
                  <span className="leaderboard-rank">{i + 1}</span>
                  <span className="leaderboard-name">{entry.nickname}</span>
                  <span className="leaderboard-stats">
                    <span>🏆 {entry.bingos}</span>
                    <span>🎮 {entry.gamesPlayed}</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="leaderboard-item">Немає даних</div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'settings' && (
        <div id="panel-settings" className={currentTab !== 'settings' ? 'hidden' : ''}>
          <div className="section">
            <div className="section-title">Інтерфейс</div>
            <div className="setting">
              <label>Тема</label>
              <select className="select" id="setting-theme" value={settings?.theme} onChange={(e) => updateSetting('theme', e.target.value)}>
                <option value="dark">Темна</option>
                <option value="light">Світла</option>
              </select>
            </div>
            <div className="setting">
              <label>Мова</label>
              <select className="select" id="setting-lang" value={settings?.uiLanguage} onChange={(e) => updateSetting('uiLanguage', e.target.value)}>
                <option value="uk">Українська</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="setting">
              <label>Позиція</label>
              <select className="select" id="setting-position" value={settings?.position} onChange={(e) => updateSetting('position', e.target.value)}>
                <option value="right">Права</option>
                <option value="left">Ліва</option>
                <option value="bottom">Низ</option>
              </select>
            </div>
            <div className="setting">
              <label>Показувати ваги</label>
              <div className="toggle">
                <input type="checkbox" id="setting-weights" checked={settings?.showWeights} onChange={(e) => updateSetting('showWeights', e.target.checked)} />
                <span className="slider"></span>
              </div>
            </div>
            <div className="setting">
              <label>Звуки</label>
              <div className="toggle">
                <input type="checkbox" id="setting-sounds" checked={settings?.soundEnabled} onChange={(e) => updateSetting('soundEnabled', e.target.checked)} />
                <span className="slider"></span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Автовиявлення</div>
            <div className="setting">
              <label>Розпізнавання мови</label>
              <div className="toggle">
                <input type="checkbox" id="setting-speech" checked={settings?.speechEnabled} onChange={(e) => updateSetting('speechEnabled', e.target.checked)} />
                <span className="slider"></span>
              </div>
            </div>
            <div className="setting">
              <label>Мова розпізнавання</label>
              <select className="select" id="setting-speech-lang" value={settings?.speechLang} onChange={(e) => updateSetting('speechLang', e.target.value)}>
                <option value="ru-RU">Русский</option>
                <option value="uk-UA">Українська</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div className="setting">
              <label>Автосканування чату</label>
              <div className="toggle">
                <input type="checkbox" id="setting-auto-detect" checked={settings?.autoDetect} onChange={(e) => updateSetting('autoDetect', e.target.checked)} />
                <span className="slider"></span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Зінго режим 🎯</div>
            <div className="setting">
              <label>Увімкнути зінго-форматування</label>
              <div className="toggle">
                <input type="checkbox" id="setting-zingo-mode" checked={settings?.zingoMode} onChange={(e) => updateSetting('zingoMode', e.target.checked)} />
                <span className="slider"></span>
              </div>
            </div>
            <div className="setting">
              <label>Інтенсивність</label>
              <select className="select" id="setting-zingo-intensity" value={settings?.zingoIntensity} onChange={(e) => updateSetting('zingoIntensity', e.target.value as Settings['zingoIntensity'])}>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="hardcore">Hardcore</option>
              </select>
            </div>
          </div>

          <div className="section">
            <div className="section-title">API</div>
            <div className="setting">
              <label>Base URL</label>
              <input className="input" id="setting-api-url" placeholder="https://api.example.com" value={settings?.apiBaseUrl || ''} onChange={(e) => updateSetting('apiBaseUrl', e.target.value)} />
            </div>
            <div className="setting">
              <label>API Key</label>
              <input className="input" id="setting-api-key" placeholder="Optional" type="password" value={settings?.apiKey || ''} onChange={(e) => updateSetting('apiKey', e.target.value)} />
            </div>
          </div>

          <div className="section">
            <div className="section-title">Акаунт</div>
            {settings?.userId && settings?.jwtToken ? (
              <div id="user-info" style={{ marginTop: '8px', fontSize: '12px', color: '#8892b0' }}>
                Logged in as {settings.userId}
              </div>
            ) : (
              <>
                <div className="btn-row">
                  <button className="btn primary" id="btn-login" onClick={() => showAuthForm('login')}>Увійти</button>
                  <button className="btn" id="btn-register" onClick={() => showAuthForm('register')}>Реєстрація</button>
                </div>
                {authMode && (
                  <div id="auth-form" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input className="input" id="auth-nickname" placeholder="Нікнейм" />
                    <input className="input" id="auth-password" placeholder="Пароль" type="password" />
                    <input className="input" id="auth-email" placeholder="Email (опціонально)" type="email" />
                    <div className="btn-row">
                      <button className="btn primary" id="auth-submit" onClick={submitAuth}>
                        {authMode === 'login' ? t('login') : t('register')}
                      </button>
                      <button className="btn" id="auth-cancel" onClick={hideAuthForm}>Скасувати</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="section">
            <div className="btn-row">
              <button className="btn" id="btn-export" onClick={exportData}>Експорт</button>
              <button className="btn" id="btn-import" onClick={importData}>Імпорт</button>
            </div>
            <div className="btn-row" style={{ marginTop: '8px' }}>
              <button className="btn" id="btn-sync" onClick={syncPhrases}>Синхронізувати фрази</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}