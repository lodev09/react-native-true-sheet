#!/bin/bash

echo "[Installing dependencies]"
yarn

echo "[Cleaning android]"
cd example/android
./gradlew clean
cd ../..

echo "[Removing temp directories]"
del-cli android/build example/android/build example/android/app/build example/ios/build

echo "[Installing pods]"
npx pod-install example
bob build
