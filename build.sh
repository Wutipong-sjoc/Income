#!/bin/bash
set -e

emcc engine/engine.cpp -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="Engine" \
  -s EXPORTED_FUNCTIONS="['_add']" \
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -o engine.js