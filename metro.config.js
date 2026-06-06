const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Windows watcher fix ────────────────────────────────────────────────────
// On Windows, the Node file watcher struggles to watch node_modules because
// it exceeds the OS handle limit. Explicitly block it from being watched.
config.watchFolders = [__dirname];

config.resolver = {
  ...config.resolver,
  blockList: [
    // Prevent Metro from watching nested node_modules inside packages
    /.*\/node_modules\/.*\/node_modules\/.*/,
  ],
};

// Use the node file watcher explicitly (avoids watchman dependency on Windows)
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: false,
  },
  watchman: {
    deferStates: [],
  },
};

module.exports = config;
