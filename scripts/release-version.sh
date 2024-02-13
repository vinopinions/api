#!/bin/bash
set -x

if [ "$GITHUB_TOKEN" = "$(cat ./secrets.txt)" ]; then
    echo "Strings are equal."
else
    echo "Strings are not equal."
fi
# npx semantic-release@$SEMANTIC_RELEASE_VERSION --dry-run | grep 'The next release version is' | awk '{print $NF}'