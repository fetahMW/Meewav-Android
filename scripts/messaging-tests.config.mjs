import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use the same shared JS toolchain as the feature builder. The Android sources
// remain the test subject; no Web files are copied or changed.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, process.env.MEEWAV_WEB_TOOLS_ROOT || '../Meewav-Web-viewer-parity');

export default {
  root,
  oxc: { jsx: { runtime: 'automatic' } },
  plugins: [{
    name: 'shared-messaging-test-dependencies',
    enforce: 'pre',
    async resolveId(id) {
      if (!/^[\w@]/.test(id) || /^[A-Za-z]:/.test(id)) return null;
      return this.resolve(id, resolve(web, 'src/test.tsx').replaceAll('\\', '/'), { skipSelf: true });
    },
  }],
  test: {
    environment: 'jsdom',
    setupFiles: ['scripts/tests/messaging/setup.ts'],
    include: ['scripts/tests/messaging/*.test.tsx'],
    clearMocks: true,
    restoreMocks: true,
  },
};
