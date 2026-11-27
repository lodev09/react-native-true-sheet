module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        componentDescriptors: [
          'TrueSheetViewComponentDescriptor',
          'TrueSheetContentViewComponentDescriptor',
          'TrueSheetFooterViewComponentDescriptor',
          'TrueSheetOverlayViewComponentDescriptor',
        ],
        cmakeListsPath: '../android/src/main/jni/CMakeLists.txt',
      },
    },
  },
};
