const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo's web condition set for ESM imports resolves zustand -> ./esm/index.mjs,
// which uses import.meta — invalid in Metro's script-mode web bundles.
// Zustand's exports map defines "react-native" before "import", so adding it
// to the web conditions makes the CJS ./index.js resolve first.
config.resolver.unstable_conditionsByPlatform = {
  ...config.resolver.unstable_conditionsByPlatform,
  web: ['react-native', 'browser'],
};

module.exports = config;
