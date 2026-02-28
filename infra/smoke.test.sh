#!/usr/bin/env bash
set -e

echo "Checking API..."
curl -sSf http://localhost:8000/health >/dev/null
echo "API OK"

echo "Checking destinations endpoint..."
curl -sSf "http://localhost:8000/destinations?maxBudget=1000" >/dev/null
echo "Destinations OK"

echo "Smoke test passed."