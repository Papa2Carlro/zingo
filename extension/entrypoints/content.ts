import { defineContentScript } from 'wxt/sandbox';
import { BingoUI } from '../src/ui/bingo';

export default defineContentScript({
  matches: [
    '*://*.omegle.com/*',
    '*://*.chatroulette.com/*',
    '*://*.emeraldchat.com/*',
    '*://*.monkey.app/*'
  ],
  runAt: 'document_idle',
  allFrames: false,
  main() {
    // Initialize the bingo UI when the content script loads in the browser
    const bingo = new BingoUI();
    bingo.init();
  }
});