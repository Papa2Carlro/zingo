export const cssVariables = `
:host {
  --zingo-bg: #1a1a2e;
  --zingo-card: #16213e;
  --zingo-border: #0f3460;
  --zingo-text: #eaeaea;
  --zingo-text-muted: #8892b0;
  --zingo-accent: #e94560;
  --zingo-accent-hover: #ff6b6b;
  --zingo-marked: #e94560;
  --zingo-marked-bg: #2d1b2e;
  --zingo-bingo: #00d9a5;
  --zingo-bingo-bg: #0a2d26;
  --zingo-category-propaganda: #e94560;
  --zingo-category-meme: #f9d342;
  --zingo-category-creepy: #a855f7;
  --zingo-category-standard: #38bdf8;
  --zingo-toast-bg: #16213e;
  --zingo-toast-border: #0f3460;
  --zingo-shadow: rgba(0, 0, 0, 0.5);
  --zingo-radius: 8px;
  --zingo-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --zingo-z-index: 2147483647;
}

:host([data-theme="light"]) {
  --zingo-bg: #f8f9fa;
  --zingo-card: #ffffff;
  --zingo-border: #dee2e6;
  --zingo-text: #212529;
  --zingo-text-muted: #6c757d;
  --zingo-marked-bg: #fff0f0;
  --zingo-bingo-bg: #e8fdf5;
  --zingo-toast-bg: #ffffff;
  --zingo-toast-border: #dee2e6;
  --zingo-shadow: rgba(0, 0, 0, 0.15);
}
`;

export const baseStyles = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#zingo-root {
  all: initial;
  font-family: var(--zingo-font);
  font-size: 14px;
  line-height: 1.5;
  color: var(--zingo-text);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  z-index: var(--zingo-z-index);
}

#zingo-root * {
  pointer-events: auto;
}

.zingo-overlay {
  position: fixed;
  pointer-events: none;
}

.zingo-overlay > * {
  pointer-events: auto;
}

.zingo-card {
  background: var(--zingo-card);
  border: 1px solid var(--zingo-border);
  border-radius: var(--zingo-radius);
  box-shadow: 0 4px 24px var(--zingo-shadow);
  padding: 12px;
  min-width: 280px;
  max-width: 360px;
}

.zingo-grid {
  display: grid;
  gap: 4px;
}

.zingo-cell {
  background: transparent;
  border: 1px solid var(--zingo-border);
  border-radius: 4px;
  padding: 8px 6px;
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-wrap: break-word;
  overflow: hidden;
}

.zingo-cell:hover {
  border-color: var(--zingo-accent);
  background: rgba(233, 69, 96, 0.1);
}

.zingo-cell.marked {
  background: var(--zingo-marked-bg);
  border-color: var(--zingo-marked);
  color: var(--zingo-marked);
}

.zingo-cell.bingo {
  background: var(--zingo-bingo-bg);
  border-color: var(--zingo-bingo);
  color: var(--zingo-bingo);
  animation: zingo-bingo-pulse 1s ease infinite;
}

@keyframes zingo-bingo-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--zingo-bingo); }
  50% { box-shadow: 0 0 8px 2px var(--zingo-bingo); }
}

.zingo-cell .category-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.8;
}

.zingo-cell .weight-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 8px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--zingo-text-muted);
  color: var(--zingo-text);
  opacity: 0.7;
}

.zingo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--zingo-border);
}

.zingo-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--zingo-accent);
}

.zingo-controls {
  display: flex;
  gap: 6px;
}

.zingo-btn {
  background: var(--zingo-card);
  border: 1px solid var(--zingo-border);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--zingo-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.zingo-btn:hover {
  border-color: var(--zingo-accent);
  color: var(--zingo-accent);
}

.zingo-btn.primary {
  background: var(--zingo-accent);
  border-color: var(--zingo-accent);
  color: white;
}

.zingo-btn.primary:hover {
  background: var(--zingo-accent-hover);
}

.zingo-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--zingo-toast-bg);
  border: 1px solid var(--zingo-toast-border);
  border-radius: var(--zingo-radius);
  padding: 12px 16px;
  box-shadow: 0 4px 24px var(--zingo-shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  animation: zingo-slide-up 0.3s ease;
  z-index: calc(var(--zingo-z-index) + 100);
}

@keyframes zingo-slide-up {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.zingo-toast .message {
  font-size: 13px;
  color: var(--zingo-text);
}

.zingo-toast .actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.zingo-toast .zingo-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.zingo-popup {
  width: 320px;
  padding: 16px;
}

.zingo-popup .section {
  margin-bottom: 16px;
}

.zingo-popup .section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--zingo-text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.zingo-popup .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--zingo-border);
}

.zingo-popup .stat-label {
  color: var(--zingo-text-muted);
  font-size: 13px;
}

.zingo-popup .stat-value {
  font-weight: 600;
  color: var(--zingo-text);
}

.zingo-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.zingo-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zingo-setting label {
  font-size: 13px;
  color: var(--zingo-text);
}

.zingo-toggle {
  position: relative;
  width: 44px;
  height: 24px;
}

.zingo-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.zingo-toggle .slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--zingo-border);
  border-radius: 24px;
  transition: 0.3s;
}

.zingo-toggle .slider:before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

.zingo-toggle input:checked + .slider {
  background: var(--zingo-accent);
}

.zingo-toggle input:checked + .slider:before {
  transform: translateX(20px);
}

.zingo-select {
  background: var(--zingo-card);
  border: 1px solid var(--zingo-border);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--zingo-text);
  cursor: pointer;
}

.zingo-input {
  background: var(--zingo-card);
  border: 1px solid var(--zingo-border);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--zingo-text);
  width: 100%;
  margin-top: 4px;
}

.zingo-input:focus {
  outline: none;
  border-color: var(--zingo-accent);
}

.zingo-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--zingo-border);
  padding-bottom: 4px;
}

.zingo-tab {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--zingo-text-muted);
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  transition: all 0.15s ease;
}

.zingo-tab.active {
  color: var(--zingo-accent);
  background: rgba(233, 69, 96, 0.1);
  border-bottom: 2px solid var(--zingo-accent);
}

.zingo-tab:hover:not(.active) {
  color: var(--zingo-text);
}

.zingo-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zingo-leaderboard-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--zingo-card);
  border: 1px solid var(--zingo-border);
  border-radius: 4px;
}

.zingo-leaderboard-rank {
  font-weight: 700;
  color: var(--zingo-accent);
  min-width: 30px;
}

.zingo-leaderboard-name {
  flex: 1;
  margin: 0 12px;
  font-size: 13px;
}

.zingo-leaderboard-stats {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--zingo-text-muted);
}
`;

export function injectStyles(shadowRoot: ShadowRoot) {
  const style = document.createElement('style');
  style.textContent = cssVariables + baseStyles;
  shadowRoot.appendChild(style);
}