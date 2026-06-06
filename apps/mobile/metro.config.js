const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// Monorepo (pnpm workspaces, node-linker=hoisted): packages live at the
// workspace root, two levels above this app. Metro must (a) watch the root so
// changes there are picked up and (b) resolve modules from the root's
// node_modules in addition to the (likely-empty) local one.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('metro-config').MetroConfig} */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
