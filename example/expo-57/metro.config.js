const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '../..');
const pkg = require('../../package.json');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const baseConfig = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

// Extend resolver to handle subpath exports with source condition
const originalResolveRequest = baseConfig.resolver.resolveRequest;

baseConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mirror Expo CLI's rewrite of @react-navigation/core -> expo-router/react-navigation.
  // The CLI only applies this to imports originating from node_modules; here the library
  // is resolved from source, so do it explicitly to exercise the real consumer path.
  if (moduleName === '@react-navigation/core') {
    return context.resolveRequest(context, 'expo-router/react-navigation', platform);
  }

  // Handle subpath exports for the main package (e.g., @lodev09/react-native-true-sheet/reanimated)
  if (moduleName.startsWith(pkg.name + '/')) {
    context = {
      ...context,
      unstable_conditionNames: ['source', ...context.unstable_conditionNames],
    };
  }

  return originalResolveRequest(context, moduleName, platform);
};

module.exports = baseConfig;
