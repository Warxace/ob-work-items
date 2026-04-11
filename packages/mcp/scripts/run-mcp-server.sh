#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

if command -v ob-wi-mcp >/dev/null 2>&1; then
  exec ob-wi-mcp "$@"
fi

NPM_PREFIX="$(npm prefix -g 2>/dev/null || true)"
if [[ -n "$NPM_PREFIX" ]]; then
  GLOBAL_BIN="$NPM_PREFIX/bin/ob-wi-mcp"
  if [[ -x "$GLOBAL_BIN" ]]; then
    exec "$GLOBAL_BIN" "$@"
  fi
fi

echo "ob-wi-mcp executable not found. Install/update the package first: npm install -g @warxace/ob-wi-mcp" >&2
exit 1
