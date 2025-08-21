# !/bin/bash

if [ "$CF_PAGES_BRANCH" == "main" ]; then
  npm run build
else
  mv .env.staging .env.production && npm run build
fi
