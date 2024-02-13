#!/bin/bash
set -x

MESSAGE=$(npx semantic-release@$SEMANTIC_RELEASE_VERSION)
FORMAT=$($MESSAGE | grep 'The next release version is' | awk '{print $NF}')

echo $FORMAT