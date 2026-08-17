import { defineConfig } from 'wxt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  manifest: {
    name: 'ZINGO - Chatroulette Bingo',
    version: '0.1.0',
    description: 'Bingo for chatroulette propaganda phrases',
    default_locale: 'uk',
    permissions: ['storage', 'contextMenus', 'offscreen'],
    host_permissions: [
      '*://*.omegle.com/*',
      '*://*.chatroulette.com/*',
      '*://*.emeraldchat.com/*',
      '*://*.monkey.app/*',
      '*://*.chatroulette.com/*'
    ],
    background: {
      service_worker: 'background.ts',
      type: 'module'
    },
    action: {
      default_popup: 'popup/index.html',
      default_title: 'ZINGO'
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true
    },
    offscreen: {
      reasons: ['AUDIO_PLAYBACK', 'DOM_SCRAPING'],
      justification: 'Speech recognition for phrase detection'
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    }
  },
  modules: ['@wxt-dev/module-react'],
  entrypointLoader: 'vite-node',
  srcDir: path.resolve(__dirname, 'src'),
  entrypointsDir: path.resolve(__dirname, 'entrypoints'),
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
  runner: {
    startUrls: ['https://omegle.com']
  }
});