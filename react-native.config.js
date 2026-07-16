module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        componentDescriptors: [
          'TrueSheetViewComponentDescriptor',
          'TrueSheetContainerViewComponentDescriptor',
          'TrueSheetContentViewComponentDescriptor',
        ],
        cmakeListsPath: '../android/src/main/jni/CMakeLists.txt',
      },
    },
  },
  dependencies: {
    '@lodev09/react-native-true-sheet': {
      platforms: {
        ios: {
          configurations: ['Debug', 'Release'],
        },
      },
    },
  },
};
