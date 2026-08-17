import { initSettings, updateSettings, getSetting, getPhrases, getCurrentSession, saveSession } from '@/db/storage';
import { fetchPhrases, fetchAnalyticsTop, fetchLeaderboard, registerUser, loginUser, sendEvent } from '@/core/api';
import { initI18n, t, changeLanguage } from '@/i18n';
import type { Settings, Phrase, GameSession } from '@/types';

class PopupUI {
  private settings: Settings | null = null;
  private currentTab = 'stats';
  private authMode: 'login' | 'register' | null = null;

  async init() {
    this.settings = await initSettings();
    await initI18n(this.settings.uiLanguage);
    this.bindEvents();
    this.applySettings();
    await this.loadStats();
    await this.loadLeaderboard();
    this.updateAuthUI();
  }

  private bindEvents() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab((e.currentTarget as HTMLElement).dataset.tab!));
    });

    // Game buttons
    document.getElementById('new-game')?.addEventListener('click', () => this.newGame());
    document.getElementById('continue-game')?.addEventListener('click', () => this.continueGame());

    // Settings
    document.getElementById('setting-theme')?.addEventListener('change', (e) => this.updateSetting('theme', (e.target as HTMLSelectElement).value));
    document.getElementById('setting-lang')?.addEventListener('change', (e) => this.updateSetting('uiLanguage', (e.target as HTMLSelectElement).value));
    document.getElementById('setting-position')?.addEventListener('change', (e) => this.updateSetting('position', (e.target as HTMLSelectElement).value));
    document.getElementById('setting-weights')?.addEventListener('change', (e) => this.updateSetting('showWeights', (e.target as HTMLInputElement).checked));
    document.getElementById('setting-sounds')?.addEventListener('change', (e) => this.updateSetting('soundEnabled', (e.target as HTMLInputElement).checked));
    document.getElementById('setting-speech')?.addEventListener('change', (e) => this.updateSetting('speechEnabled', (e.target as HTMLInputElement).checked));
    document.getElementById('setting-speech-lang')?.addEventListener('change', (e) => this.updateSetting('speechLang', (e.target as HTMLSelectElement).value));
    document.getElementById('setting-auto-detect')?.addEventListener('change', (e) => this.updateSetting('autoDetect', (e.target as HTMLInputElement).checked));
    document.getElementById('setting-api-url')?.addEventListener('change', (e) => this.updateSetting('apiBaseUrl', (e.target as HTMLInputElement).value));
    document.getElementById('setting-api-key')?.addEventListener('change', (e) => this.updateSetting('apiKey', (e.target as HTMLInputElement).value));
    document.getElementById('setting-zingo-mode')?.addEventListener('change', (e) => this.updateSetting('zingoMode', (e.target as HTMLInputElement).checked));
    document.getElementById('setting-zingo-intensity')?.addEventListener('change', (e) => this.updateSetting('zingoIntensity', (e.target as HTMLSelectElement).value as Settings['zingoIntensity']));

    // Auth
    document.getElementById('btn-login')?.addEventListener('click', () => this.showAuthForm('login'));
    document.getElementById('btn-register')?.addEventListener('click', () => this.showAuthForm('register'));
    document.getElementById('auth-submit')?.addEventListener('click', () => this.submitAuth());
    document.getElementById('auth-cancel')?.addEventListener('click', () => this.hideAuthForm());

    // Export/Import/Sync
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportData());
    document.getElementById('btn-import')?.addEventListener('click', () => this.importData());
    document.getElementById('btn-sync')?.addEventListener('click', () => this.syncPhrases());
  }

  private switchTab(tab: string) {
    this.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => {
      const el = t as HTMLElement;
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('[id^="panel-"]').forEach(p => {
      const el = p as HTMLElement;
      el.classList.toggle('hidden', el.id !== `panel-${tab}`);
    });
  }

  private applySettings() {
    if (!this.settings) return;
    (document.getElementById('setting-theme') as HTMLSelectElement).value = this.settings.theme;
    (document.getElementById('setting-lang') as HTMLSelectElement).value = this.settings.uiLanguage;
    (document.getElementById('setting-position') as HTMLSelectElement).value = this.settings.position;
    (document.getElementById('setting-weights') as HTMLInputElement).checked = this.settings.showWeights;
    (document.getElementById('setting-sounds') as HTMLInputElement).checked = this.settings.soundEnabled;
    (document.getElementById('setting-speech') as HTMLInputElement).checked = this.settings.speechEnabled;
    (document.getElementById('setting-speech-lang') as HTMLSelectElement).value = this.settings.speechLang;
    (document.getElementById('setting-auto-detect') as HTMLInputElement).checked = this.settings.autoDetect;
    (document.getElementById('setting-api-url') as HTMLInputElement).value = this.settings.apiBaseUrl;
    (document.getElementById('setting-api-key') as HTMLInputElement).value = this.settings.apiKey || '';
    (document.getElementById('setting-zingo-mode') as HTMLInputElement).checked = this.settings.zingoMode;
    (document.getElementById('setting-zingo-intensity') as HTMLSelectElement).value = this.settings.zingoIntensity;
  }

  private async updateSetting(key: keyof Settings, value: unknown) {
    this.settings = await updateSettings({ [key]: value } as Partial<Settings>);
    if (key === 'uiLanguage') {
      await changeLanguage(value as 'uk' | 'ru' | 'en');
      this.retranslateUI();
    }
    // Notify content script
    this.broadcastToContentScript({ type: 'settings-updated', settings: this.settings });
  }

  private retranslateUI() {
    // Update static text
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n')!;
      el.textContent = t(key);
    });
  }

  private async loadStats() {
    try {
      const [top, categories] = await Promise.all([
        fetchAnalyticsTop('week', 10),
        fetchAnalyticsTop('week', 100), // reuse for categories
      ]);

      const topEl = document.getElementById('top-phrases');
      if (topEl) {
        topEl.innerHTML = (top as any[]).slice(0, 5).map((p, i) =>
          `<div style="padding: 4px 0;">${i + 1}. ${p.text || p.phrase_id} — ${p.count} ${t('hits')}</div>`
        ).join('');
      }

      const catEl = document.getElementById('category-stats');
      if (catEl) {
        const catMap: Record<string, number> = {};
        (categories as any[]).forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.count; });
        catEl.innerHTML = Object.entries(catMap).map(([cat, count]) =>
          `<div style="padding: 4px 0;">${t(cat)}: ${count}</div>`
        ).join('');
      }

      // Session stats
      const session = await getCurrentSession();
      if (session) {
        const marked = Object.keys(session.marked).length;
        (document.getElementById('stat-marked') as HTMLElement).textContent = `${marked} / 25`;
        (document.getElementById('stat-bingo') as HTMLElement).textContent = session.bingoLines?.length.toString() || '0';
        (document.getElementById('stat-platform') as HTMLElement).textContent = session.platform;
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }

  private async loadLeaderboard() {
    try {
      const data = await fetchLeaderboard();
      const list = document.getElementById('leaderboard-list');
      if (list) {
        list.innerHTML = (data as any[]).slice(0, 10).map((entry, i) =>
          `<div class="leaderboard-item">
            <span class="leaderboard-rank">${i + 1}</span>
            <span class="leaderboard-name">${entry.nickname}</span>
            <span class="leaderboard-stats"><span>🏆 ${entry.bingos}</span><span>🎮 ${entry.gamesPlayed}</span></span>
          </div>`
        ).join('');
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
    }
  }

  private async newGame() {
    // Send message to content script
    this.broadcastToContentScript({ type: 'new-game' });
    window.close();
  }

  private async continueGame() {
    this.broadcastToContentScript({ type: 'continue-game' });
    window.close();
  }

  private showAuthForm(mode: 'login' | 'register') {
    this.authMode = mode;
    document.getElementById('auth-form')?.classList.remove('hidden');
    document.getElementById('btn-login')?.classList.add('hidden');
    document.getElementById('btn-register')?.classList.add('hidden');
    (document.getElementById('auth-submit') as HTMLElement).textContent = mode === 'login' ? t('login') : t('register');
  }

  private hideAuthForm() {
    this.authMode = null;
    document.getElementById('auth-form')?.classList.add('hidden');
    document.getElementById('btn-login')?.classList.remove('hidden');
    document.getElementById('btn-register')?.classList.remove('hidden');
    (document.getElementById('auth-nickname') as HTMLInputElement).value = '';
    (document.getElementById('auth-password') as HTMLInputElement).value = '';
    (document.getElementById('auth-email') as HTMLInputElement).value = '';
  }

  private async submitAuth() {
    const nickname = (document.getElementById('auth-nickname') as HTMLInputElement).value.trim();
    const password = (document.getElementById('auth-password') as HTMLInputElement).value;
    const email = (document.getElementById('auth-email') as HTMLInputElement).value.trim();

    if (!nickname || !password) return;

    try {
      let data;
      if (this.authMode === 'register') {
        data = await registerUser(nickname, password, email || undefined);
      } else {
        data = await loginUser(nickname, password);
      }

      this.settings = await updateSettings({
        userId: String(data.user.id),
        jwtToken: data.token,
      });
      this.updateAuthUI();
      this.hideAuthForm();
      this.loadStats();
      this.loadLeaderboard();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  private updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    if (this.settings?.userId && this.settings?.jwtToken) {
      userInfo?.classList.remove('hidden');
      userInfo!.textContent = `Logged in as ${this.settings.userId}`;
      document.getElementById('btn-login')?.classList.add('hidden');
      document.getElementById('btn-register')?.classList.add('hidden');
    } else {
      userInfo?.classList.add('hidden');
      document.getElementById('btn-login')?.classList.remove('hidden');
      document.getElementById('btn-register')?.classList.remove('hidden');
    }
  }

  private async exportData() {
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
  }

  private async importData() {
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
  }

  private async syncPhrases() {
    try {
      const phrases = await fetchPhrases();
      const { savePhrases } = await import('@/db/storage');
      await savePhrases(phrases);
      this.settings = await updateSettings({});
      alert(t('exportSuccess'));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  private broadcastToContentScript(message: unknown) {
    // Send to all tabs
    chrome.runtime.sendMessage(message).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupUI().init());