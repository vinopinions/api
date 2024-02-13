#!/bin/bash
set -x

npx semantic-release@$SEMANTIC_RELEASE_VERSION --dry-run | grep 'The next release version is' | awk '{print $NF}'