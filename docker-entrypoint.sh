#!/bin/bash
set -e

echo "Starting Xvfb and Node process..."
# Run the start script wrapped in Xvfb
# This tricks Playwright's headless: false into running in a virtual display
exec xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" ./node_modules/.bin/tsx src/workers/start.ts
