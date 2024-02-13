#!/bin/bash
set -x

echo "GITHUB_TOKEN length = ${#$GITHUB_TOKEN}"
echo "GITHUB_TOKENP length = ${#$GITHUB_TOKENP}"

echo "GITHUB_TOKEN 50th letter = ${$GITHUB_TOKEN:50:51}"
echo "GITHUB_TOKENP 50th letter = ${$GITHUB_TOKENP:50:51}"

if [ "$GITHUB_TOKEN" = "$GITHUB_TOKENP" ]; then
    echo "Strings are equal."
else
    echo "Strings are not equal."
fi
# npx semantic-release@$SEMANTIC_RELEASE_VERSION --dry-run | grep 'The next release version is' | awk '{print $NF}'