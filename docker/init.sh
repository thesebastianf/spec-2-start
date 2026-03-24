#!/bin/bash
# ===================================
# docker/init.sh
# Creates local dev files from examples
# Run from docker/: bash init.sh
# ===================================

set -e

# Resolve to script's own directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "🚀 Spec-2-Start — Local Setup"
echo "==============================="

# .env
if [ ! -f ".env" ]; then
  echo "Creating .env from .env-example..."
  {
    echo "# ⚠️  WARNING: only for local development — do not use in production"
    echo "# Generated from .env-example"
    echo ""
    cat .env-example
  } > .env
  echo "✅ .env created"
else
  echo "ℹ️  .env already exists, skipping"
fi

# docker-compose.yaml
if [ ! -f "docker-compose.yaml" ]; then
  echo "Creating docker-compose.yaml from docker-compose.yaml-example..."
  {
    echo "# ⚠️  WARNING: only for local development — do not use in production"
    echo "# Generated from docker-compose.yaml-example"
    echo ""
    cat docker-compose.yaml-example
  } > docker-compose.yaml
  echo "✅ docker-compose.yaml created"
else
  echo "ℹ️  docker-compose.yaml already exists, skipping"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Build and start:"
echo "   docker compose up --build -d"
echo ""
echo "   Open in browser:"
echo "   http://localhost:8080"
echo ""
