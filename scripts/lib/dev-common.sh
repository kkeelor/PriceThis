#!/usr/bin/env bash
set -euo pipefail

# Project root — set by the caller (dev.sh). Do not overwrite here.
: "${ROOT:?ROOT must be set by caller}"

DEV_DIR="$ROOT/.dev"
API_PID="$DEV_DIR/api.pid"
METRO_PID="$DEV_DIR/metro.pid"
API_LOG="$DEV_DIR/api.log"
METRO_LOG="$DEV_DIR/metro.log"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk-17.0.19+10/Contents/Home}"
export PATH="$HOME/.local/bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

mkdir -p "$DEV_DIR"

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file")"
  kill -0 "$pid" 2>/dev/null
}

api_healthy() {
  curl -sf "http://localhost:3000/api/health" >/dev/null 2>&1
}

metro_healthy() {
  curl -sf "http://localhost:8081/status" >/dev/null 2>&1
}

get_lan_ip() {
  ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' \
    || echo "localhost"
}

record_port_pid() {
  local port="$1"
  local pid_file="$2"
  local owner
  owner="$(port_owner "$port")"
  if [[ -n "$owner" ]]; then
    echo "$owner" >"$pid_file"
  fi
}

stop_pid_file() {
  local name="$1"
  local pid_file="$2"
  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    echo "Stopping $name (pid $pid)…"
    # Kill process group so npm/node children don't linger
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti ":$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

port_owner() {
  lsof -ti ":$1" 2>/dev/null | head -1 || true
}

free_port_if_stale() {
  local port="$1"
  local pid_file="$2"
  local owner
  owner="$(port_owner "$port")"
  [[ -n "$owner" ]] || return 0

  if [[ -f "$pid_file" ]]; then
    local expected
    expected="$(cat "$pid_file")"
    if [[ "$owner" == "$expected" ]]; then
      return 0
    fi
  fi

  echo "Port $port in use by pid $owner — stopping it…"
  kill "$owner" 2>/dev/null || true
  sleep 1
  kill -9 "$owner" 2>/dev/null || true
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-30}"
  for _ in $(seq 1 "$attempts"); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "✓ $label ready"
      return 0
    fi
    sleep 1
  done
  echo "✗ $label failed to start — check $DEV_DIR logs"
  return 1
}

device_ready() {
  adb devices 2>/dev/null | grep -w "device" | grep -v "List" >/dev/null
}

setup_adb_reverse() {
  if ! command -v adb >/dev/null 2>&1; then
    echo "⚠ adb not found — skipping port forwarding"
    return 0
  fi
  if ! device_ready; then
    echo "⚠ No Android device — skipping adb reverse (plug in phone to enable)"
    return 0
  fi
  adb reverse tcp:8081 tcp:8081 >/dev/null
  adb reverse tcp:3000 tcp:3000 >/dev/null

  local lan_ip
  lan_ip="$(get_lan_ip)"
  if [[ "$lan_ip" != "localhost" ]]; then
    adb shell setprop metro.host "$lan_ip" >/dev/null 2>&1 || true
    echo "✓ adb reverse: 8081 + 3000 | metro.host=$lan_ip (WiFi fallback)"
  else
    echo "✓ adb reverse: 8081 (Metro) + 3000 (API)"
  fi
}

prebuild_bundle() {
  echo "Pre-building JS bundle (first time ~20s)…"
  if curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /dev/null; then
    echo "✓ JS bundle ready"
    return 0
  fi
  echo "✗ Failed to build JS bundle — check .dev/metro.log"
  return 1
}

launch_app() {
  if ! device_ready; then
    return 0
  fi
  adb shell am force-stop com.pricethis >/dev/null 2>&1 || true
  adb shell am start -n com.pricethis/.MainActivity >/dev/null
  echo "✓ Launched PriceThis on device"
}
