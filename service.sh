#!/bin/bash

cmd=$1
if [ "$cmd" == "" ]; then
	echo "Usage: $0 start|stop"
	exit
fi

pm2 $cmd ./pm2.config.js

