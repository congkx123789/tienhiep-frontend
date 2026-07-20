#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import webbrowser

def load_env():
    for env_file in [".env", ".env.local"]:
        if os.path.exists(env_file):
            with open(env_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()

load_env()

appetize_token = os.environ.get("APPETIZE_API_TOKEN", "")
if not appetize_token:
    print("❌ Error: APPETIZE_API_TOKEN not found in environment or .env.local!")
    sys.exit(1)

apk_path = "android/app/build/outputs/apk/debug/app-debug.apk"
if not os.path.exists(apk_path):
    print(f"❌ Error: Android APK not found at {apk_path}! Did you run 'npm run android:build' first?")
    sys.exit(1)

print("🚀 Uploading Android APK to Appetize.io...")
url = "https://api.appetize.io/v1/apps"

cmd = f"curl -s -X POST '{url}' -H 'X-API-KEY: {appetize_token}' -F 'file=@{apk_path}' -F 'platform=android'"
try:
    output = subprocess.check_output(cmd, shell=True).decode()
    data = json.loads(output)
    public_key = data.get("publicKey")
    app_url = data.get("publicURL") or f"https://appetize.io/app/{public_key}"
    
    print(f"🎉 Appetize.io upload successful!")
    print(f"👉 Play your Android App online here: {app_url}")
    
    print("🌐 Opening Android Emulator in your default browser...")
    webbrowser.open(app_url)
    
except Exception as e:
    print(f"❌ Failed to upload to Appetize: {e}")
