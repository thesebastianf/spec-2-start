#!/bin/bash
# ===================================
# init-local.sh
# Creates local dev files from examples
# Run after clone: bash init-local.sh
# ===================================

set -e

echo "🚀 Initializing local development environment..."

# Create docker-compose.yaml from example
if [ ! -f "docker-compose.yaml" ]; then
  echo "Creating docker-compose.yaml from example..."
  {
    echo "# ⚠️  WARNING: only for local development, do not use in production"
    echo "# Generated from docker-compose.yaml-example — keep in sync"
    echo ""
    cat docker-compose.yaml-example
  } > docker-compose.yaml
  echo "✅ docker-compose.yaml created"
else
  echo "ℹ️  docker-compose.yaml already exists, skipping"
fi

# Create .env from example
if [ ! -f ".env" ]; then
  echo "Creating .env from example..."
  {
    echo "# ⚠️  WARNING: only for local development, do not use in production"
    echo "# Generated from .env-example — replace secrets with real values"
    echo ""
    cat .env-example
  } > .env
  echo "✅ .env created"
else
  echo "ℹ️  .env already exists, skipping"
fi

echo ""
echo "✅ Local environment ready!"
echo "   Run: docker compose up -d"
