// swift-tools-version: 6.0

// Swift Package Manager manifest consumed by React Native's SwiftPM autolinking
// (react-native >= 0.88, `npx react-native spm`). CocoaPods keeps using
// RNTrueSheet.podspec and is unaffected.
//
// The autolinker references this package through a symlink at
// <app>/ios/build/generated/autolinking/libs/RNTrueSheet, and SwiftPM resolves
// the relative `.package(path:)` entries below against that symlink, so they
// point at the app's prebuilt React Native and codegen packages. They do not
// resolve in a bare clone of this repository.

import PackageDescription

let package = Package(
  name: "react-native-true-sheet",
  platforms: [.iOS("15.1")],
  products: [
    .library(name: "RNTrueSheet", targets: ["RNTrueSheet"]),
  ],
  dependencies: [
    .package(name: "ReactNative", path: "../../../../xcframeworks"),
    .package(name: "React-GeneratedCode", path: "../../../ios"),
  ],
  targets: [
    .target(
      name: "RNTrueSheet",
      dependencies: [
        .product(name: "ReactHeaders", package: "ReactNative"),
        .product(name: "ReactNativeHeaders", package: "ReactNative"),
        .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
        .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
      ],
      path: ".",
      // tvOS builds stubs only (see the podspec); SwiftPM autolinking targets iOS.
      exclude: ["ios/tvos"],
      sources: ["ios", "common/cpp"],
      publicHeadersPath: "ios",
      cSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        .headerSearchPath("ios"),
        .headerSearchPath("ios/core"),
        .headerSearchPath("ios/events"),
        .headerSearchPath("ios/utils"),
        .headerSearchPath("common/cpp"),
      ],
      cxxSettings: [
        .define("RCT_NEW_ARCH_ENABLED", to: "1"),
        // Must match the prebuilt React.framework's config-gated C++ ABI.
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
        .headerSearchPath("ios"),
        .headerSearchPath("ios/core"),
        .headerSearchPath("ios/events"),
        .headerSearchPath("ios/utils"),
        .headerSearchPath("common/cpp"),
      ],
      linkerSettings: [
        .linkedFramework("UIKit"),
        .linkedFramework("Foundation"),
      ]
    ),
  ],
  cxxLanguageStandard: .cxx20
)
