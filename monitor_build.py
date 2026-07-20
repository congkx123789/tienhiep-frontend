#!/usr/bin/env python3
import urllib.request
import json
import time
import sys
import subprocess
import os

# Function to load .env variables manually
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

# Load token from env or file
TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not TOKEN and os.path.exists(".git_token"):
    with open(".git_token", "r") as f:
        TOKEN = f.read().strip()

if not TOKEN:
    print("❌ Error: GitHub Token not found in .env.local, .env, .git_token, or environment variable!")
    sys.exit(1)

REPO = "congkx123789/tienhiep-frontend"

def make_request(url):
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    })
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def get_latest_run():
    data = make_request(f"https://api.github.com/repos/{REPO}/actions/runs?limit=1")
    runs = data.get("workflow_runs", [])
    return runs[0] if runs else None

def get_job_details(run_id):
    return make_request(f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}/jobs")

def fetch_job_logs(job_id):
    cmd = f"curl -s -H 'Authorization: Bearer {TOKEN}' -L https://api.github.com/repos/{REPO}/actions/jobs/{job_id}/logs"
    try:
        output = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL)
        return output.decode("utf-8", errors="ignore")
    except Exception as e:
        return f"Failed to fetch logs: {e}"

def download_artifact(run_id):
    print("📦 Finding iOS IPA artifact...")
    artifacts_url = f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}/artifacts"
    try:
        data = make_request(artifacts_url)
        for art in data.get("artifacts", []):
            if art.get("name") == "tts-ios-unsigned-ipa":
                art_id = art["id"]
                download_url = art["archive_download_url"]
                print(f"⏬ Downloading artifact: {art['name']} ({art['size_in_bytes'] / 1024 / 1024:.2f} MB)...")
                # Download using curl
                cmd = f"curl -s -L -H 'Authorization: Bearer {TOKEN}' -o TienHiepAI_Unsigned.zip '{download_url}'"
                subprocess.run(cmd, shell=True, check=True)
                print("📦 Extracting IPA from download package...")
                subprocess.run("unzip -o TienHiepAI_Unsigned.zip && mv -f TienHiepAI_Unsigned.ipa TienHiepAI.ipa && rm -f TienHiepAI_Unsigned.zip", shell=True, check=True)
                print("✅ Download and extraction complete! File saved as TienHiepAI.ipa")
                return True
    except Exception as e:
        print(f"❌ Failed to download artifact: {e}")
    return False

def upload_to_appetize():
    print("ℹ️ Skipping Appetize.io upload because this is a physical device IPA build (not for simulator).")
    return

def main():
    print("🚀 Triggering git push to GitHub...")
    subprocess.run("git add .", shell=True)
    status = subprocess.check_output("git status --porcelain", shell=True).decode()
    if status.strip():
        subprocess.run('git commit -m "ci: update iOS targets and triggers"', shell=True)
        subprocess.run("git push origin main", shell=True)
    else:
        print("No local changes, pushing empty commit to force trigger...")
        subprocess.run('git commit --allow-empty -m "ci: force re-trigger build"', shell=True)
        subprocess.run("git push origin main", shell=True)

    print("\n⏳ Waiting for GitHub Actions to register the new run...")
    time.sleep(5)

    run = get_latest_run()
    if not run:
        print("❌ No workflow runs found!")
        return

    run_id = run["id"]
    print(f"👉 Found run: {run['name']} #{run['run_number']}")
    print(f"🔗 URL: {run['html_url']}")
    
    last_status = None
    while True:
        try:
            data = make_request(f"https://api.github.com/repos/{REPO}/actions/runs/{run_id}")
            status = data.get("status")
            conclusion = data.get("conclusion")
            
            if status != last_status:
                print(f"Status changed: {status} (Conclusion: {conclusion})")
                last_status = status
            
            if status == "completed":
                if conclusion == "success":
                    print("\n✅ BUILD SUCCESSFUL! 🎉")
                    print(f"Artifacts will be available at: {run['html_url']}")
                    if download_artifact(run_id):
                        upload_to_appetize()
                else:
                    print("\n❌ BUILD FAILED! Fetching failure logs...")
                    jobs_data = get_job_details(run_id)
                    for job in jobs_data.get("jobs", []):
                        if job.get("conclusion") == "failure":
                            print(f"\n--- Logs for failed job: {job['name']} ---")
                            logs = fetch_job_logs(job["id"])
                            lines = logs.split("\n")
                            for line in lines[-60:]:
                                print(line)
                break
            
            time.sleep(10)
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped by user.")
            break
        except Exception as e:
            print(f"Error while polling: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
