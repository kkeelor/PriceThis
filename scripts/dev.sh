#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/dev-common.sh
source "$ROOT/scripts/lib/dev-common.sh"

INSTALL=false
LAUNCH=true
FOREGROUND=false

usage() {
  cat <<EOF
Usage: ./scripts/dev.sh [command] [options]

Commands:
  start       Start API + Metro + adb reverse (default)
  stop        Stop API and Metro
  restart     stop + start
  reload      adb reverse + reload app on device
  status      Show what's running
  logs        Tail API and Metro logs

Options:
  --install   Build/install APK before launching
  --no-launch Don't open the app on the device
  --foreground  Stay attached and tail logs (Ctrl+C stops everything)

Examples:
  npm run dev
  npm run dev:install
  ./scripts/dev.sh reload
EOF
}

CMD="start"

while [[ $# -gt 0 ]]; do
  case "$1" in
    start|stop|restart|reload|status|logs) CMD="$1"; shift ;;
    --install) INSTALL=true; shift ;;
    --no-launch) LAUNCH=false; shift ;;
    --foreground) FOREGROUND=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

start_api() {
  if api_healthy; then
    record_port_pid 3000 "$API_PID"
    echo "✓ API already running"
    return 0
  fi

  free_port_if_stale 3000 "$API_PID"
  stop_port 3000
  (
    cd "$ROOT/server"
    npx tsx --env-file=.env dev-server.ts
  ) >>"$API_LOG" 2>&1 &
  sleep 1
  record_port_pid 3000 "$API_PID"
  wait_for_url "http://localhost:3000/api/health" "API server"
}

start_metro() {
  if metro_healthy; then
    record_port_pid 8081 "$METRO_PID"
    echo "✓ Metro already running"
    return 0
  fi

  free_port_if_stale 8081 "$METRO_PID"
  stop_port 8081
  (
    cd "$ROOT"
    npx react-native start --host 0.0.0.0
  ) >>"$METRO_LOG" 2>&1 &
  sleep 2
  record_port_pid 8081 "$METRO_PID"
  wait_for_url "http://localhost:8081/status" "Metro bundler" 90
}

stop_all() {
  stop_pid_file "API" "$API_PID"
  stop_pid_file "Metro" "$METRO_PID"
  stop_port 3000
  stop_port 8081
}

reload_device() {
  if ! metro_healthy; then
    echo "Metro is not running — starting dev environment first…"
    do_start --no-launch-internal
  fi
  setup_adb_reverse
  prebuild_bundle || true
  if device_ready; then
    adb shell am force-stop com.pricethis >/dev/null
    adb shell am start -n com.pricethis/.MainActivity >/dev/null
    echo "✓ Reloaded app on device"
  else
    echo "⚠ No device connected — plug in phone and run: npm run dev:reload"
  fi
}

do_start() {
  local skip_launch=false
  if [[ "${1:-}" == "--no-launch-internal" ]]; then
    skip_launch=true
  fi

  cd "$ROOT"
  mkdir -p "$DEV_DIR"

  if [[ ! -d "$ROOT/server/node_modules" ]]; then
    echo "Installing API dependencies…"
    (cd "$ROOT/server" && npm install --silent)
  fi

  if [[ ! -f server/.env ]]; then
    cp server/.env.example server/.env
    echo "Created server/.env — add your ANTHROPIC_API_KEY, then run again."
    exit 1
  fi
  if ! grep -qE '^ANTHROPIC_API_KEY=sk-' server/.env 2>/dev/null; then
    echo "Add your Claude API key to server/.env"
    exit 1
  fi

  if [[ ! -f .env ]]; then
    cp .env.example .env
  fi

  echo "🚀 Starting PriceThis dev environment"
  echo ""

  start_api
  start_metro
  setup_adb_reverse
  prebuild_bundle

  if [[ "$skip_launch" == true ]]; then
    return 0
  fi

  if [[ "$INSTALL" == true ]]; then
    "$ROOT/scripts/run-android-device.sh"
  elif [[ "$LAUNCH" == true ]]; then
    launch_app
  fi

  echo ""
  echo "────────────────────────────────────────"
  echo "✅ Dev environment running"
  echo ""
  echo "  API:    http://localhost:3000"
  echo "  Metro:  http://localhost:8081"
  echo "  Logs:   npm run dev:logs"
  echo "  Reload: npm run dev:reload"
  echo "  Stop:   npm run dev:stop"
  echo ""
  echo "Phone must stay USB-connected (or same WiFi)."
  echo "If blank screen: npm run dev:reload"
  echo "────────────────────────────────────────"

  if [[ "$FOREGROUND" == true ]]; then
    echo ""
    echo "Tailing logs (Ctrl+C stops everything)…"
    trap 'echo ""; echo "Stopping…"; stop_all; exit 0' INT TERM
    tail -f "$API_LOG" "$METRO_LOG"
  fi
}

case "$CMD" in
  start) do_start ;;
  stop)
    stop_all
    echo "Dev environment stopped."
    ;;
  restart)
    stop_all
    sleep 1
    do_start
    ;;
  reload) reload_device ;;
  status)
    echo "PriceThis dev status"
    echo "────────────────────"
    if api_healthy; then
      echo "API:   running (http://localhost:3000)"
    else
      echo "API:   stopped"
    fi
    if metro_healthy; then
      echo "Metro: running (http://localhost:8081)"
    else
      echo "Metro: stopped"
    fi
    if device_ready 2>/dev/null; then
      echo "Device: connected"
      adb reverse --list 2>/dev/null | rg "8081|3000" || echo "  (adb reverse not set — run npm run dev:reload)"
    else
      echo "Device: not connected"
    fi
    ;;
  logs)
    touch "$API_LOG" "$METRO_LOG"
    tail -f "$API_LOG" "$METRO_LOG"
    ;;
esac
