#!/bin/bash
set -e

ADB="/home/alida/Android/Sdk/platform-tools/adb"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE_NAME="com.lyvuha.tts"

echo "📱 Checking for connected Android devices..."
DEVICES=$($ADB devices | grep -v "List of devices" | grep "device" || true)

if [ -z "$DEVICES" ]; then
    echo "⚠️  No Android device detected!"
    echo "Please make sure:"
    echo "  1. Your phone is connected to the computer via USB."
    echo "  2. 'USB Debugging' is enabled in your phone's Developer Options."
    echo "  3. You accepted the 'Allow USB debugging' prompt on your phone screen."
    exit 1
fi

echo "✅ Device detected!"
echo "$DEVICES"

if [ ! -f "$APK_PATH" ]; then
    echo "📦 APK not found, building first..."
    npm run android:build
fi

echo "📥 Installing app-debug.apk on your phone..."
$ADB install -r "$APK_PATH"

echo "🚀 Launching Tien Hiep AI on your phone..."
$ADB shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1

echo "🎉 Done! The app is now open on your phone screen."
