#!/bin/bash

dotnet test \
    --configuration=Release \
    --no-restore \
    --filter "Category=Unit&Service=weatherForecast" \
    -p:CollectCoverage=true \
    -p:CoverletOutputFormat=cobertura \
    -p:CoverletOutput=TestResults/ \
    -p:Threshold=10 \
    -p:SkipAutoProps=true \ || exit 1

# use -p:ThresholdType=line/branch/method for individual thresholds
