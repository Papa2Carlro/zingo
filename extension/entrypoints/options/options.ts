import { initSettings, updateSettings, getSetting } from '@/db/storage';
import { initI18n, t, changeLanguage } from '@/i18n';
import type { Settings } from '@/types';

class OptionsUI {
  private settings: Settings | null = null;

  async init() {
    this.settings = await initSettings();
    await initI18n(this.settings.uiLanguage);
    this.bindEvents();
    this.applySettings();
  }

  private bindEvents() {
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

    document.getElementById('btn-sync')?.addEventListener('click', () => this.syncPhrases());
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportData());
    document.getElementById('btn-import')?.addEventListener('click', () => this.importData());
    document.getElementById('btn-reset')?.addEventListener('click', () => this.resetAll());
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
  }

  private async updateSetting(key: keyof Settings, value: unknown) {
    this.settings = await updateSettings({ [key]: value } as Partial<Settings>);
    if (key === 'uiLanguage') {
      await changeLanguage(value as 'uk' | 'ru' | 'en');
    }
    chrome.runtime.sendMessage({ type: 'settings-updated', settings: this.settings }).catch(() => {});
  }

  private async syncPhrases() {
    const { fetchPhrases } = await import('@/core/api');
    const { savePhrases } = await import('@/db/storage');
    try {
      const phrases = await fetchPhrases();
      await savePhrases(phrases);
      alert('Synced');
    } catch (e) {
      alert((e as Error).message);
    }
  }

  private async exportData() {
    const { getPhrases, getCurrentSession, getSetting } = await import('@/db/storage');
    const phrases = await getPhrases();
    const session = await getCurrentSession();
    const cards = await getSetting('cards', []);
    const data = { phrases, session, cards, settings: this.settings, exportedAt: Date.now() };
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
        if (data.settings) {
          await updateSettings(data.settings);
          this.settings = data.settings;
          this.applySettings();
        }
        alert('Imported');
      } catch {
        alert('Error');
      }
    };
    input.click();
  }

  private async resetAll() {
    if (!confirm('Reset all data?')) return;
    const db = await import('@/db/idb');
    await db.closeDB();
    indexedDB.deleteDatabase('zingo');
    location.reload();
  }
}

document.addEventListener('DOMContentLoaded', () => new OptionsUI().init());