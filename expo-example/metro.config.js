const { getDefaultConfig } = require('expo/metro-config');
const { getConfig } = require('react-native-monorepo-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

module.exports = getConfig(config, {
  projectRoot,
  monorepoRoot,
});
