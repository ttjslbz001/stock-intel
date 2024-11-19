#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CSV file is provided as argument
if [ $# -eq 0 ]; then
    echo "Please provide the path to your credentials CSV file"
    echo "Usage: $0 <path-to-credentials.csv>"
    exit 1
fi

# Read credentials from CSV file using osascript
CSV_CONTENT=$(osascript -e "set csvFile to (POSIX file \"$1\")
set csvData to read csvFile
return csvData")

if [ $? -ne 0 ]; then
    echo "Error: Cannot read file $1"
    echo "Please check if the file exists and try again"
    exit 1
fi

# Parse the CSV content (skip header, get second line)
AWS_ACCESS_KEY_ID=$(echo "$CSV_CONTENT" | sed -n '2p' | cut -d',' -f1)
AWS_SECRET_ACCESS_KEY=$(echo "$CSV_CONTENT" | sed -n '2p' | cut -d',' -f2)
AWS_REGION=${2:-us-east-1}  # Use second argument as region or default to us-east-1

# Configure AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"
aws configure set output "json"

# Verify the configuration
if aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials configured successfully!"
    echo "Region set to: $AWS_REGION"
else
    echo "Failed to configure AWS credentials. Please check your access key and secret key."
    exit 1
fi