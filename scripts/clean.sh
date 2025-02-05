#!/bin/bash

cd example/android
./gradlew clean
cd ../..

del-cli android/build example/android/build example/android/app/build example/ios/build lib
