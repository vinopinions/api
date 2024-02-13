#!/bin/bash
set -x

export GITHUB_TOKEN=$GITHUB_TOKEN
export BRANCH_NAME=$BRANCH_NAME

npx semantic-release@$SEMANTIC_RELEASE_VERSION --dry-run | grep 'The next release version is' | awk '{print $NF}'