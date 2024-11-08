#!/bin/bash

# Check if a name was provided
if [ -z "$1" ]
then
    echo "Please provide an application name"
    echo "Usage: ./create-app.sh <app-name> [--type=node|express]"
    exit 1
fi

APP_NAME=$1
APP_TYPE="node"

# Parse arguments
for arg in "$@"
do
    case $arg in
        --type=*)
        APP_TYPE="${arg#*=}"
        shift
        ;;
    esac
done

case $APP_TYPE in
    "node")
        npx nx g @nx/node:application "apps/${APP_NAME}"
        ;;
    "express")
        npx nx g @nx/express:application "apps/${APP_NAME}"
        ;;
    *)
        echo "Unknown app type: ${APP_TYPE}"
        echo "Supported types: node, express"
        exit 1
        ;;
esac

echo "Created ${APP_TYPE} application: ${APP_NAME}" 