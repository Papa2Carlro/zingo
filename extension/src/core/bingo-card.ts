import type { Phrase, BingoCard as BingoCardType } from '../types';

export interface BingoCardConfig {
    size: { x: number; y: number };
    phrases: Phrase[];
    name?: string;
}

export class BingoCardElement extends HTMLElement {
  private shadow: ShadowRoot;
  private card: {
    id: string;
    name: string;
    size: { x: number; y: number };
    phrases: string[];
    isPreset: boolean;
    createdAt: number;
  };

    constructor(config: BingoCardConfig) {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        // Розрахувати ширину та висоту з config.size
        const width = config.size.x || 5;
        const height = config.size.y || 5;
        this.card = {
            id: crypto.randomUUID(),
            name: config.name || 'New Card',
            phrases: config.phrases.map(p => p.id),
            size: { x: width, y: height },
            isPreset: false,
            createdAt: Date.now(),
        };
        this.render();
    }

    setCard(card: BingoCardType): void {
        this.card = card;
        this.render();
    }

    getCard(): BingoCardType {
        return this.card;
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'card-id' && oldValue !== newValue) {
            // Could load card by ID from storage if needed
            console.log('Card ID changed to:', newValue);
        }
    }

    private async loadCardById(id: string): Promise<void> {
        // Placeholder for future implementation
        console.log('Loading card:', id);
    }

    private render(): void {
        this.shadow.innerHTML = '';

        const style = document.createElement('style');
        style.textContent = `
      :host {
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 600px;
        padding: 12px;
        background: var(--bg-color, #1a1a2e);
        color: var(--text-color, #e0e0e0);
        border-radius: 8px;
        margin: 8px;
      }
      .card {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns, 5), 1fr);
        grid-template-rows: repeat(var(--grid-rows, 5), auto);
        gap: 4px;
        background: #16213e;
        border-radius: 4px;
        padding: 8px;
        width: 100%;
      }
      .cell {
        aspect-ratio: 1;
        background: #0f3460;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c5c6c9;
        font-size: 12px;
        min-height: 40px;
        min-width: 40px;
        margin: 2px;
        user-select: none;
        border: 2px solid transparent;
      }
      .cell.marked {
        border-color: #e94560;
        background: #fa449c;
        color: white;
      }
      .cell.bingo {
        border-color: #4cc9f0;
        background: #4cc9f0;
        color: white;
      }
    `;
        this.shadow.appendChild(style);

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        const size = this.card.size || { x: 5, y: 5 };

        // Set grid CSS vars
        cardEl.style.setProperty('--grid-columns', String(size.x));
        cardEl.style.setProperty('--grid-rows', String(size.y));

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'grid-column: 1 / -1; text-align: center; margin-bottom: 8px; font-weight: bold;';
        header.textContent = this.card.name || 'Bingo Card';
        cardEl.appendChild(header);

        // Grid cells
        const totalCells = (this.card.size || { x: 5, y: 5 }).x * (this.card.size || { x: 5, y: 5 }).y;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.id = this.card.phrases[i] || `phrase-${i}`;
            cell.textContent = this.card.phrases[i]?.substring(0, 12) || '-';
            // Click to mark
            cell.addEventListener('click', () => this.toggleMark(cell));
            cardEl.appendChild(cell);
        }

        this.shadow.appendChild(cardEl);
    }

    private toggleMark(cell: HTMLElement): void {
        cell.classList.toggle('marked');
    }
}