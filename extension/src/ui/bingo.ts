import { injectStyles } from './styles';
import { t, initI18n } from '../i18n';
import type { BingoCard, GameSession, Phrase, Settings } from '../types';
import { getPhrases, getCurrentSession, saveSession, initSettings, updateSettings } from '../db/storage';
import { generateCard, checkBingo } from '../core/generator';
import { findBestMatch } from '../core/matcher';
import { speechManager, type ZingoSpeechResult } from '../core/speech';
import { sendEvent } from '../core/api';
import { formatText } from '../../../packages/zingo-formatter/dist';

export class BingoUI {
    private shadowRoot: ShadowRoot;
    private card: BingoCard | null = null;
    private session: GameSession | null = null;
    private phrases: Phrase[] = [];
    private settings: Settings | null = null;
    private toastElement: HTMLElement | null = null;
    private speechActive = false;

    constructor() {
        const host = document.createElement('div');
        host.id = 'zingo-root';
        document.documentElement.appendChild(host);
        this.shadowRoot = host.attachShadow({ mode: 'open' });
        injectStyles(this.shadowRoot);
    }

    async init() {
        this.settings = await initSettings();
        await initI18n(this.settings.uiLanguage);

        // Sync phrases from backend on startup
        const { syncPhrases } = await import('../db/storage');
        this.phrases = await syncPhrases();

        const session = await getCurrentSession();
        this.session = session ?? null;

        if (!this.session && this.phrases.length > 0) {
            await this.newGame();
        } else if (this.session) {
            this.card = await this.getCard(this.session.cardId);
        }

        this.render();
        this.setupSpeech();
        this.setupTextDetection();
        this.setupSync();
    }

    private async getCard(id: string): Promise<BingoCard | null> {
        const { getCard } = await import('../db/storage');
        const card = await getCard(id);
        return card ?? null;
    }

    async newGame() {
        // Phrases are already synced in init()
        if (this.phrases.length < 25) {
            const { syncPhrases } = await import('../db/storage');
            this.phrases = await syncPhrases();
        }
        this.card = generateCard(this.phrases, { x: 5, y: 5 });
        this.session = {
            id: crypto.randomUUID(),
            cardId: this.card.id,
            marked: {},
            startedAt: Date.now(),
            platform: this.detectPlatform(),
        };
        await saveSession(this.session);
        this.render();
    }

    private detectPlatform(): string {
        const hostname = window.location.hostname;
        if (hostname.includes('omegle')) return 'omegle';
        if (hostname.includes('chatroulette')) return 'chatroulette';
        if (hostname.includes('emeraldchat')) return 'emeraldchat';
        if (hostname.includes('monkey')) return 'monkey';
        return 'unknown';
    }

    private render() {
        this.shadowRoot.innerHTML = '';
        injectStyles(this.shadowRoot);

        if (!this.card || !this.session) {
            this.renderEmptyState();
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = `zingo-overlay zingo-position-${this.settings?.position || 'right'}`;
        overlay.innerHTML = this.renderCard();
        this.shadowRoot.appendChild(overlay);

        this.attachCellListeners();
    }

    private renderEmptyState() {
        const overlay = document.createElement('div');
        overlay.className = 'zingo-overlay zingo-position-right';
        overlay.innerHTML = `
      <div class="zingo-card" style="text-align: center; padding: 24px;">
        <div class="zingo-title">${t('appName')}</div>
        <p style="color: var(--zingo-text-muted); margin: 16px 0;">${t('offline')}</p>
        <button class="zingo-btn primary" id="zingo-new-game">${t('newGame')}</button>
      </div>
    `;
        this.shadowRoot.appendChild(overlay);
        this.shadowRoot.getElementById('zingo-new-game')?.addEventListener('click', () => this.newGame());
    }

    private renderCard(): string {
        const { x: width, y: height } = this.card!.size;
        const marked = this.session!.marked;
        const bingoLines = checkBingo(this.card!, marked);

        let gridHtml = '';
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const idx = r * width + c;
                const phraseId = this.card!.phrases[idx];
                const phrase = this.phrases.find(p => p.id === phraseId);
                const isMarked = !!marked[phraseId];
                const isBingo = bingoLines.some(line => {
                    if (line.startsWith('row-')) return parseInt(line.split('-')[1]) === r;
                    if (line.startsWith('col-')) return parseInt(line.split('-')[1]) === c;
                    if (line === 'diag-main') return r === c;
                    if (line === 'diag-anti') return r + c === width - 1;
                    return false;
                });

                const categoryClass = phrase ? `category-${phrase.category}` : '';
                const categoryLabel = phrase ? t(phrase.category) : '';
                const weightLabel = phrase ? `${t('weight')}: ${phrase.weight}` : '';

                gridHtml += `
          <button class="zingo-cell ${isMarked ? 'marked' : ''} ${isBingo ? 'bingo' : ''} ${categoryClass}"
                  data-phrase-id="${phraseId}"
                  data-index="${idx}"
                  ${isMarked ? 'disabled' : ''}>
            ${phrase ? `<span>${this.escapeHtml(this.formatText(phrase.text))}</span>` : ''}
            ${this.settings?.showWeights && phrase ? `<span class="weight-badge">${phrase.weight}</span>` : ''}
            ${phrase ? `<span class="category-badge ${categoryClass}">${categoryLabel}</span>` : ''}
          </button>
        `;
            }
        }

        const markedCount = Object.keys(marked).length;
        const totalCells = width * height;

        return `
      <div class="zingo-card">
        <div class="zingo-header">
          <div class="zingo-title">${t('appName')}</div>
          <div class="zingo-controls">
            <button class="zingo-btn" id="zingo-new-game" title="${t('newGame')}">🔄</button>
            <button class="zingo-btn" id="zingo-settings" title="${t('settings')}">⚙</button>
          </div>
        </div>
        <div class="zingo-grid" style="grid-template-columns: repeat(${width}, 1fr);">
          ${gridHtml}
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 11px; color: var(--zingo-text-muted);">
          <span>${markedCount} / ${totalCells} ${t('marked')}</span>
          ${bingoLines.length > 0 ? `<span style="color: var(--zingo-bingo); font-weight: 700;">${t('bingo')}</span>` : ''}
        </div>
      </div>
    `;
    }

    private attachCellListeners() {
        this.shadowRoot.querySelectorAll('.zingo-cell:not(.marked)').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const phraseId = target.dataset.phraseId;
                if (phraseId) this.markPhrase(phraseId, 'manual');
            });
        });

        this.shadowRoot.getElementById('zingo-new-game')?.addEventListener('click', () => this.newGame());
        this.shadowRoot.getElementById('zingo-settings')?.addEventListener('click', () => this.openSettings());
    }

    async markPhrase(phraseId: string, source: 'manual' | 'speech' | 'text' = 'manual') {
        if (!this.session || !this.card) return;
        if (this.session.marked[phraseId]) return;

        this.session.marked[phraseId] = Date.now();
        await saveSession(this.session);

        const phrase = this.phrases.find(p => p.id === phraseId);
        if (phrase) {
            await this.sendAnalytics(phrase, source);
        }

        const bingoLines = checkBingo(this.card, this.session.marked);
        if (bingoLines.length > 0) {
            this.session.bingoLines = bingoLines;
            this.session.completedAt = Date.now();
            await saveSession(this.session);
            this.showToast(`${t('bingo')}! ${bingoLines.length} line(s)!`);
            if (this.settings?.soundEnabled) this.playSound('bingo');
        }

        this.render();
    }

    private async sendAnalytics(phrase: Phrase, source: 'manual' | 'speech' | 'text') {
        if (!this.settings) return;
        const event = {
            phraseId: phrase.id,
            category: phrase.category,
            platform: this.session!.platform,
            anonHash: this.settings.anonHash,
            userId: this.settings.userId,
            timestamp: Date.now(),
            source,
        };
        try {
            await sendEvent(event);
        } catch {
            // Queue for retry
            const { addPendingEvent } = await import('../db/storage');
            await addPendingEvent(event);
        }
    }

    private setupSpeech() {
        if (!this.settings?.speechEnabled) return;
        speechManager.setLanguage(this.settings.speechLang);
        speechManager.start(this.handleSpeechResult.bind(this));
        this.speechActive = true;
    }

    private handleSpeechResult(result: ZingoSpeechResult) {
        if (!result.isFinal || result.confidence < 0.7) return;
        const match = findBestMatch(result.transcript, this.phrases);
        if (match && match.confidence > 0.8) {
            this.showConfirmToast(match.phrase, result.transcript);
        }
    }

    private showConfirmToast(phrase: Phrase, heard: string) {
        if (this.toastElement) this.toastElement.remove();

        this.toastElement = document.createElement('div');
        this.toastElement.className = 'zingo-toast';
        this.toastElement.innerHTML = `
      <div class="message">${t('phraseDetected')}: <strong>"${this.escapeHtml(this.formatText(heard))}"</strong> → <strong>${this.escapeHtml(this.formatText(phrase.text))}</strong>?</div>
      <div class="actions">
        <button class="zingo-btn primary" data-action="yes">${t('yes')}</button>
        <button class="zingo-btn" data-action="no">${t('no')}</button>
        <button class="zingo-btn" data-action="ignore">${t('ignore')}</button>
      </div>
    `;

        this.shadowRoot.appendChild(this.toastElement);

        this.toastElement.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action;
                if (action === 'yes') this.markPhrase(phrase.id, 'speech');
                this.toastElement?.remove();
                this.toastElement = null;
            });
        });

        setTimeout(() => {
            this.toastElement?.remove();
            this.toastElement = null;
        }, 10000);
    }

    private setupTextDetection() {
        const observer = new MutationObserver(() => {
            if (!this.settings?.autoDetect) return;
            this.scanChatText();
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    private scanChatText() {
        // Simplified: look for text in common chat selectors
        const selectors = [
            '[class*="chat"]', '[class*="message"]', '[class*="text"]',
            '.stranger', '.partner', '.message-text'
        ];
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const text = el.textContent?.trim();
                if (text && text.length > 3 && text.length < 200) {
                    const match = findBestMatch(text, this.phrases);
                    if (match && match.confidence > 0.85) {
                        this.showConfirmToast(match.phrase, text);
                    }
                }
            });
        }
    }

    private setupSync() {
        // Periodic sync of pending events
        setInterval(async () => {
            const { getPendingEvents, removePendingEvent, incrementPendingRetries } = await import('../db/storage');
            const pending = await getPendingEvents();
            for (const event of pending) {
                if (!event.id) continue;
                try {
                    await sendEvent(event);
                    await removePendingEvent(event.id);
                } catch {
                    await incrementPendingRetries(event.id);
                }
            }
        }, 30000);
    }

    private openSettings() {
        // TODO: Open settings panel
        console.log('Open settings');
    }

    private showToast(message: string) {
        const toast = document.createElement('div');
        toast.className = 'zingo-toast';
        toast.textContent = message;
        this.shadowRoot.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    private playSound(type: 'bingo' | 'mark') {
        // TODO: Play sound
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private formatText(text: string): string {
        if (!this.settings?.zingoMode) return text;
        try {
            return formatText(text, { intensity: this.settings.zingoIntensity || 'medium' });
        } catch {
            return text;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BingoUI().init());
} else {
    new BingoUI().init();
}