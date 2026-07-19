#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

required_files=(
  "05_Meta/README.md"
  "05_Meta/START_HERE.md"
  "CLAUDE.md"
  "AGENTS.md"
  "index.md"
  "log.md"
  "05_Meta/VERSION"
  "05_Meta/LICENSE.md"
  "05_Meta/TEMPLATE_MANIFEST.md"
)

required_dirs=(
  "01_Raw"
  "03_Conversations"
  "02_Wiki/sources"
  "02_Wiki/concepts"
  "02_Wiki/decisions"
  "02_Wiki/errors"
  "02_Wiki/projects"
  "02_Wiki/design"
  "02_Wiki/dev-tasks"
  "04_Prompts"
  "05_Meta/scripts"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$ROOT/$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$ROOT/$dir" ]]; then
    echo "Missing required directory: $dir" >&2
    exit 1
  fi
done

if find "$ROOT" -name ".DS_Store" -o -name "Thumbs.db" | grep -q .; then
  echo "Remove OS metadata files before distribution." >&2
  exit 1
fi

if grep -RInE "(sk-|api[_-]?key|password|token|secret)" "$ROOT" \
  --exclude-dir=.obsidian \
  --exclude="validate-template.sh" \
  --exclude="live_server.py" \
  --exclude="telegram_bridge.py" \
  --exclude="cron_scheduler.py" \
  --exclude=".env" \
  --exclude=".env.example" \
  --exclude="*.md" \
  --exclude=".gitignore" >/tmp/ai-agent-wiki-template-secrets.txt; then
  echo "Potential secret-like text found:" >&2
  cat /tmp/ai-agent-wiki-template-secrets.txt >&2
  exit 1
fi

echo "Template validation passed: $ROOT"
