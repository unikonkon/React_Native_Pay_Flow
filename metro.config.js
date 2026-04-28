const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a wa-sqlite.wasm asset; let Metro resolve it.
config.resolver.assetExts.push('wasm');

// wa-sqlite needs SharedArrayBuffer → requires cross-origin isolation headers.
config.server = config.server || {};
const prevEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const wrapped = prevEnhanceMiddleware ? prevEnhanceMiddleware(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return wrapped(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './global.css' });
