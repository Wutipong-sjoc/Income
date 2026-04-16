#!/bin/bash
set -e

emcc engine/ImgProc.cpp -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="Engine" \
  -s EXPORTED_FUNCTIONS='["_myrun","_get_final","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","HEAPU8"]' \
  -o engine_myrun.js