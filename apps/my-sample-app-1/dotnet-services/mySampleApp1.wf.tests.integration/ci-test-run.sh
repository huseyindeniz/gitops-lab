#!/bin/bash

dotnet test \
    --configuration=Release \
    --no-restore \
    --no-build \
    --filter "Category=Integration&Service=weatherForecast" \
    --logger "trx;LogFileName=mySampleApp1-wf-tests.integration.trx" || exit 1