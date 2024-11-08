#!/bin/bash

# Check if a name was provided
if [ -z "$1" ]
then
    echo "Please provide a library name"
    echo "Usage: ./create-lib.sh <lib-name> [--python]"
    exit 1
fi

LIB_NAME=$1
IS_PYTHON=false

# Check for Python flag
if [ "$2" = "--python" ]; then
    IS_PYTHON=true
fi

if [ "$IS_PYTHON" = true ]; then
    # Create Python library
    mkdir -p "packages/${LIB_NAME}"
    cd "packages/${LIB_NAME}"
    
    # Create pyproject.toml
    cat > pyproject.toml << EOL
[tool.poetry]
name = "${LIB_NAME}"
version = "0.1.0"
description = "Python library for ${LIB_NAME}"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.8"

[tool.poetry.dev-dependencies]
pytest = "^7.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
EOL

    # Create package structure
    mkdir -p "${LIB_NAME//-/_}"
    touch "${LIB_NAME//-/_}/__init__.py"
    mkdir -p tests
    touch tests/__init__.py
    
    echo "Created Python library ${LIB_NAME}"
else
    # Create TypeScript/JavaScript library using nx
    npx nx g @nx/js:lib "packages/${LIB_NAME}" --publishable --importPath="@source/${LIB_NAME}"
fi 