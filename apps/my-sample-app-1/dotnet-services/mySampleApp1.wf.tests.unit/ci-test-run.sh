#!/bin/bash

dotnet test \
    --configuration=Release \
    --no-restore \
    --no-build \
    --filter "Category=Unit&Service=weatherForecast" \
    -p:CollectCoverage=true \
    -p:CoverletOutputFormat=cobertura \
    -p:CoverletOutput=TestResults/coverage.cobertura.xml \
    -p:Threshold=10 \
    -p:SkipAutoProps=true \
    --logger "trx;LogFileName=mySampleApp1-wf-tests.unit.trx" || exit 1

# use -p:ThresholdType=line/branch/method for individual thresholds
