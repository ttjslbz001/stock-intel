import os
from typing import List, Dict, Any
import boto3
import json
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
from .base_collector import BaseNewsCollector
from .exceptions import NewsCollectorError, NewsConfigurationError

class S3CacheCollector(BaseNewsCollector):
    """Cache layer implementation using S3"""
    
    def __init__(self, base_collector: BaseNewsCollector, bucket_name: str = None, cache_expiry_days: int = 1):
        self.collector = base_collector
        self.bucket_name = bucket_name or os.getenv("CACHE_BUCKET_NAME")
        if not self.bucket_name:
            raise NewsConfigurationError("CACHE_BUCKET_NAME not found in environment variables")
        
        self.cache_expiry_days = cache_expiry_days
        self.s3_client = boto3.client('s3')

    def _get_cache_key(self, symbol: str, days_back: int) -> str:
        date_str = datetime.now().strftime('%Y-%m-%d')
        return f"news_cache/{symbol}/{date_str}_{days_back}_days.json"

    def _get_from_cache(self, cache_key: str) -> List[Dict[str, Any]] | None:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=cache_key)
            last_modified = response['LastModified']
            
            if datetime.now(last_modified.tzinfo) - last_modified > timedelta(days=self.cache_expiry_days):
                return None
                
            return json.loads(response['Body'].read().decode('utf-8'))
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise NewsCollectorError(f"Error accessing S3 cache: {str(e)}")

    def _save_to_cache(self, cache_key: str, data: List[Dict[str, Any]]) -> None:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=cache_key,
                Body=json.dumps(data),
                ContentType='application/json'
            )
        except ClientError as e:
            raise NewsCollectorError(f"Error saving to S3 cache: {str(e)}")

    def collect(self, symbol: str, days_back: int = 7) -> List[Dict[str, Any]]:
        cache_key = self._get_cache_key(symbol, days_back)
        cached_data = self._get_from_cache(cache_key)
        
        if cached_data is not None:
            return cached_data

        # Get fresh data from the base collector
        data = self.collector.collect(symbol, days_back)
        
        # Save to cache
        self._save_to_cache(cache_key, data)
        return data

    def validate_data(self, data: List[Dict[str, Any]]) -> bool:
        return self.collector.validate_data(data) 