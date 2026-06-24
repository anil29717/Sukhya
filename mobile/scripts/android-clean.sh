#!/usr/bin/env bash
# Safe Android clean for Expo / React Native (New Architecture).
#
# Do NOT use `./gradlew clean` — it runs CMake clean after codegen JNI folders
# are already deleted, which causes "add_subdirectory ... is not an existing directory".
#
# This script removes build artifacts manually, then you can rebuild with:
#   cd android && ./gradlew assembleRelease

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$ROOT/android"

echo "Removing Android app build caches..."
rm -rf \
  "$ANDROID/app/build" \
  "$ANDROID/app/.cxx" \
  "$ANDROID/build" \
  "$ANDROID/.gradle"

echo "Removing native module build outputs in node_modules..."
for dir in \
  "@react-native-async-storage/async-storage" \
  "react-native-reanimated" \
  "react-native-webview" \
  "react-native-worklets" \
  "react-native-screens" \
  "react-native-safe-area-context" \
  "expo-modules-core"; do
  rm -rf "$ROOT/node_modules/$dir/android/build" 2>/dev/null || true
  rm -rf "$ROOT/node_modules/$dir/android/.cxx" 2>/dev/null || true
done

echo "Done. Rebuild with: cd android && ./gradlew assembleRelease"
