#!/bin/zsh
set -euo pipefail

MODE="${1:-}"

if [[ -z "$MODE" ]]; then
  echo "Usage: ./start.sh [dev|docker|test|stop]"
  exit 1
fi

# Always run relative to where this script lives
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

start_bg () {
  local name="$1"
  shift
  echo "   ↳ starting $name..."
  ("$@" > "$LOG_DIR/$name.log" 2>&1) &
  echo $! > "$PID_DIR/$name.pid"
  echo "   ↳ $name PID $(cat "$PID_DIR/$name.pid") (log: $LOG_DIR/$name.log)"
}

stop_pid () {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "   ↳ stopping $name (PID $pid)..."
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
}

case "$MODE" in
  dev)
    echo "🚀 Starting DEV mode on macOS"

    # ---------- AI Service ----------
    echo "▶ AI Service"
    if [[ -f "$ROOT_DIR/ai-service/run.py" ]]; then
      start_bg "ai-service" zsh -lc "cd '$ROOT_DIR/ai-service' && ./.venv/bin/python run.py"
    else
      echo "   ↳ skipped ai-service (run.py not found)"
    fi

    # ---------- Backend ----------
    echo "▶ Backend"
    if [[ -f "$ROOT_DIR/backend/pom.xml" ]]; then
      if [[ -x "$ROOT_DIR/backend/mvnw" ]]; then
        start_bg "backend" zsh -lc "cd '$ROOT_DIR/backend' && ./mvnw spring-boot:run"
      else
        # fallback to system maven if wrapper isn't present/executable
        start_bg "backend" zsh -lc "cd '$ROOT_DIR/backend' && mvn spring-boot:run"
      fi
    else
      echo "   ↳ skipped backend (pom.xml not found)"
    fi

    # ---------- Frontend ----------
    echo "▶ Frontend"
    if [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
      start_bg "frontend" zsh -lc "cd '$ROOT_DIR/frontend' && npm install && npm run dev"
    else
      echo "   ↳ skipped frontend (no package.json at $ROOT_DIR/frontend)"
      echo "   ↳ create one with: cd frontend && npm init -y  (or scaffold Vite/Next)"
    fi

    echo ""
    echo "✅ Dev services launched."
    echo "   Logs: $LOG_DIR"
    echo "   Stop: ./start.sh stop"
    ;;

  docker)
    echo "🐳 Docker mode"
    cd "$ROOT_DIR"
    docker-compose up --build
    ;;

  test)
    echo "🧪 Running tests"
    if [[ -f "$ROOT_DIR/tests/test_integration.py" ]]; then
      (cd "$ROOT_DIR/tests" && python3 test_integration.py)
    else
      echo "   ↳ tests folder or test_integration.py not found"
      exit 1
    fi
    ;;

  stop)
    echo "🛑 Stopping services"
    stop_pid "frontend"
    stop_pid "backend"
    stop_pid "ai-service"

    # Optional: if something was started outside PID tracking, try gentle cleanup
    pkill -f "uvicorn.*8001" 2>/dev/null || true
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true

    cd "$ROOT_DIR"
    docker-compose down 2>/dev/null || true
    echo "✅ Stopped."
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./start.sh [dev|docker|test|stop]"
    exit 1
    ;;
esac
