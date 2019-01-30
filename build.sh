#!/bin/sh

docker build -t skonves/node-10 .
docker run --rm skonves/node-10 cat /tmp/runtime.zip > ./runtime.zip