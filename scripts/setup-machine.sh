#!/usr/bin/env bash
# =============================================================================
# setup-machine.sh — onboarding скрипт для ob-wi-mcp на новой машине
#
# Что делает:
#   1. Проверяет наличие node и git
#   2. Настраивает ~/.npmrc для GitHub Packages (auth + registry scope)
#   3. Клонирует work-items репо
#   4. Создаёт/обновляет ~/.config/opencode/opencode.json
#   5. Smoke test: npx @warxace/ob-wi-mcp --version
#
# Использование:
#   bash setup-machine.sh
# =============================================================================

set -euo pipefail

PACKAGE_SCOPE="@warxace"
PACKAGE_NAME="@warxace/ob-wi-mcp"
WORKITEMS_REPO="git@github.com:Warxace/openbrain-workitem-store.git"
REGISTRY="https://npm.pkg.github.com"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

# ─── Цвета ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[info]${NC}  $*"; }
ok()      { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

echo ""
echo "  ob-wi-mcp — setup for new machine"
echo "  ==================================="
echo ""

# ─── 1. Проверка зависимостей ─────────────────────────────────────────────────
info "Checking dependencies..."

if ! command -v node &>/dev/null; then
  die "node not found. Install Node.js (v18+) first: https://nodejs.org"
fi
NODE_VERSION=$(node --version)
ok "node $NODE_VERSION"

if ! command -v git &>/dev/null; then
  die "git not found. Install git first."
fi
ok "git $(git --version | awk '{print $3}')"

if ! command -v npm &>/dev/null; then
  die "npm not found. Should come with Node.js."
fi
ok "npm $(npm --version)"

echo ""

# ─── 2. GitHub PAT для GitHub Packages ───────────────────────────────────────
info "GitHub Packages authentication setup"
echo ""
echo "  You need a GitHub Personal Access Token (classic) with scopes:"
echo "    - read:packages"
echo "    - repo  (if the repository is private)"
echo ""
echo "  Create one at: https://github.com/settings/tokens"
echo ""

# Проверим есть ли уже токен в ~/.npmrc
NPMRC_FILE="$HOME/.npmrc"
EXISTING_TOKEN=""
if [[ -f "$NPMRC_FILE" ]]; then
  EXISTING_TOKEN=$(grep -oP "(?<=//:_authToken=)ghp_\S+" "$NPMRC_FILE" 2>/dev/null || true)
fi

if [[ -n "$EXISTING_TOKEN" ]]; then
  warn "Found existing token in ~/.npmrc: ${EXISTING_TOKEN:0:10}..."
  read -rp "  Use existing token? [Y/n] " USE_EXISTING
  USE_EXISTING="${USE_EXISTING:-Y}"
  if [[ "$USE_EXISTING" =~ ^[Yy]$ ]]; then
    GH_TOKEN="$EXISTING_TOKEN"
    ok "Using existing token."
  else
    read -rsp "  Enter new GitHub PAT: " GH_TOKEN
    echo ""
  fi
else
  read -rsp "  Enter GitHub PAT (input hidden): " GH_TOKEN
  echo ""
fi

[[ -z "$GH_TOKEN" ]] && die "Token cannot be empty."

# Записываем в ~/.npmrc
# Удаляем старые строки с github.com registry если есть, добавляем новые
touch "$NPMRC_FILE"

# Убираем старые записи для этого registry
TMPFILE=$(mktemp)
grep -v "npm.pkg.github.com" "$NPMRC_FILE" > "$TMPFILE" || true
cat "$TMPFILE" > "$NPMRC_FILE"
rm "$TMPFILE"

# Добавляем свежие
cat >> "$NPMRC_FILE" << EOF
${PACKAGE_SCOPE}:registry=${REGISTRY}
//${REGISTRY#https://}/:_authToken=${GH_TOKEN}
EOF

ok "~/.npmrc configured for GitHub Packages."
echo ""

# ─── 3. Клонирование work-items ───────────────────────────────────────────────
info "work-items repository setup"
echo ""

DEFAULT_PATH="$HOME/work-items"
read -rp "  Where to clone work-items? [${DEFAULT_PATH}] " WI_PATH
WI_PATH="${WI_PATH:-$DEFAULT_PATH}"

# Раскрываем ~ вручную если нужно
WI_PATH="${WI_PATH/#\~/$HOME}"

if [[ -d "$WI_PATH/.git" ]]; then
  warn "Directory $WI_PATH already exists and is a git repo."
  read -rp "  Pull latest changes instead of cloning? [Y/n] " DO_PULL
  DO_PULL="${DO_PULL:-Y}"
  if [[ "$DO_PULL" =~ ^[Yy]$ ]]; then
    info "Pulling latest changes..."
    git -C "$WI_PATH" pull --rebase
    ok "work-items updated."
  else
    ok "Skipping, using existing directory."
  fi
elif [[ -d "$WI_PATH" ]] && [[ -n "$(ls -A "$WI_PATH")" ]]; then
  die "Directory $WI_PATH already exists and is not empty. Remove it or choose another path."
else
  info "Cloning $WORKITEMS_REPO → $WI_PATH ..."
  git clone "$WORKITEMS_REPO" "$WI_PATH"
  ok "work-items cloned to $WI_PATH"
fi

echo ""

# ─── 4. Opencode config ───────────────────────────────────────────────────────
info "Configuring opencode..."

mkdir -p "$(dirname "$OPENCODE_CONFIG")"

# Если конфиг уже существует — читаем и мержим mcp секцию
if [[ -f "$OPENCODE_CONFIG" ]]; then
  warn "Existing opencode config found at $OPENCODE_CONFIG"
  warn "The 'work-items' MCP entry will be added/updated."
  echo ""
  # Бэкап
  cp "$OPENCODE_CONFIG" "${OPENCODE_CONFIG}.bak"
  info "Backup saved to ${OPENCODE_CONFIG}.bak"

  # Используем node для мержа (он уже есть)
  node - <<JSEOF
const fs = require('fs');
const path = '${OPENCODE_CONFIG}';
let config = {};
try { config = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) {}
config.mcp = config.mcp || {};
config.mcp['work-items'] = {
  type: 'local',
  command: ['npx', '-y', '${PACKAGE_NAME}', '--path', '${WI_PATH}'],
  enabled: true
};
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
console.log('Config updated.');
JSEOF
else
  cat > "$OPENCODE_CONFIG" << JSONEOF
{
  "\$schema": "https://opencode.ai/config.json",
  "mcp": {
    "work-items": {
      "type": "local",
      "command": ["npx", "-y", "${PACKAGE_NAME}", "--path", "${WI_PATH}"],
      "enabled": true
    }
  }
}
JSONEOF
fi

ok "opencode config written to $OPENCODE_CONFIG"
echo ""

# ─── 5. Smoke test ────────────────────────────────────────────────────────────
info "Running smoke test..."

# Очищаем npx кэш для пакета чтобы убедиться что скачиваем свежий
NPX_OUTPUT=$(npx -y "$PACKAGE_NAME" --version 2>&1) || true

if echo "$NPX_OUTPUT" | grep -qE "^[0-9]+\.[0-9]+\.[0-9]+$"; then
  VERSION=$(echo "$NPX_OUTPUT" | grep -E "^[0-9]+\.[0-9]+\.[0-9]+$")
  ok "Smoke test passed! ${PACKAGE_NAME}@${VERSION} works."
else
  warn "Smoke test output: $NPX_OUTPUT"
  warn "Could not confirm version. Check that the package is published and the PAT has read:packages scope."
fi

echo ""
echo "  ─────────────────────────────────────────"
echo "  Setup complete!"
echo ""
echo "  work-items path : $WI_PATH"
echo "  opencode config : $OPENCODE_CONFIG"
echo ""
echo "  Restart opencode to pick up the new MCP server."
echo "  ─────────────────────────────────────────"
echo ""
