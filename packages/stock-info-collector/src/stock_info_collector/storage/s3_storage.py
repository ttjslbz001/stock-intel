from typing import Any, Dict, Optional
import boto3
import json
from datetime import datetime

from .base import StorageSystem

class S3Storage(StorageSystem):
    """AWS S3-based storage system."""
    
    def __init__(self, bucket_name: str, prefix: str = ""):
        self.bucket_name = bucket_name
        self.prefix = prefix
        self.s3_client = boto3.client('s3')
    
    def save(self, data: Any, data_type: str, metadata: Optional[Dict] = None) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        key = f"{self.prefix}/{data_type}_{timestamp}.json"
        
        storage_data = {
            "data": data,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
            "data_type": data_type
        }
        
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=json.dumps(storage_data)
        )
        
        return f"s3://{self.bucket_name}/{key}"
    
    def load(self, identifier: str) -> Any:
        # Extract bucket and key from s3:// URL
        _, _, bucket_key = identifier.partition('s3://')
        bucket, _, key = bucket_key.partition('/')
        
        response = self.s3_client.get_object(Bucket=bucket, Key=key)
        storage_data = json.loads(response['Body'].read())
        return storage_data["data"] 