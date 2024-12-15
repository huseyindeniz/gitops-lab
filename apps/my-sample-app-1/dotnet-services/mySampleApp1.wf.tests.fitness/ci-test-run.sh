#!/bin/bash

dotnet test \
    --configuration=Release \
    --no-restore \
    --no-build \
    --filter "Category=Fitness&Service=weatherForecast" \
    --logger "trx;LogFileName=mySampleApp1-wf-tests.fitness.trx" || exit 1
