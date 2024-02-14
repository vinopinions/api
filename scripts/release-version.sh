#!/bin/bash
set -x

npx semantic-release@$SEMANTIC_RELEASE_VERSION
# MESSAGE=$(npx semantic-release@$SEMANTIC_RELEASE_VERSION)

# FORMAT=$($MESSAGE | grep 'The next release version is' | awk '{print $NF}')

# echo $FORMAT