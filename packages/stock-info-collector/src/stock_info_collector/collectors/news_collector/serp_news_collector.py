from typing import List, Dict, Any
from serpapi import GoogleSearch
from datetime import datetime, timedelta
import os
from .base_collector import BaseNewsCollector
from .exceptions import NewsCollectorError, NewsConfigurationError, NewsAPIError
from .search_result import NewsSearchResult
from dotenv import load_dotenv
from dataclasses import dataclass
import boto3

@dataclass
class SerpNewsItem:
    title: str
    link: str
    source: str
    date: str
    snippet: str
    collected_at: datetime

    @classmethod
    def from_dict(cls, data: dict) -> 'SerpNewsItem':
        """Create a SerpNewsItem from a dictionary"""
        return cls(
            title=data['title'],
            link=data['link'],
            source=data['source'],
            date=data['date'],
            snippet=data['snippet'],
            collected_at=datetime.fromisoformat(data['collected_at'])
        )

    def to_dict(self) -> dict:
        """Convert to dictionary format"""
        return {
            'title': self.title,
            'link': self.link,
            'source': self.source,
            'date': self.date,
            'snippet': self.snippet,
            'collected_at': self.collected_at.isoformat()
        }

class SerpNewsResult:
    def __init__(self, items: List[SerpNewsItem]):
        self.items = items

    @classmethod
    def from_json(cls, data: List[dict]) -> 'SerpNewsResult':
        """Create a SerpNewsResult from JSON data"""
        items = [SerpNewsItem.from_dict(item) for item in data]
        return cls(items)

    def to_json(self) -> List[dict]:
        """Convert to JSON format"""
        return [item.to_dict() for item in self.items]

class SerpNewsCollector(BaseNewsCollector):
    """
    Collector for gathering stock-related news using SERP API
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the SERP news collector
        
        Args:
            api_key: SerpAPI key. If not provided, will try to get from .env.local
        """
        # Load environment variables from .env.local
        load_dotenv('.env.local')
        
        self.api_key = api_key or os.getenv("SERPAPI_KEY",'2f7956e82042db253c07baaa5d69de362be1bdf0610092532bdcd7d096bbdc2e')
        if not self.api_key:
            raise NewsConfigurationError("SERPAPI_KEY not found in environment variables")

    def collect(self, symbol: str, days_back: int = 7) -> SerpNewsResult:
        """
        Collect news articles for a given stock symbol
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            days_back: Number of days to look back for news
            
        Returns:
            List of news articles with title, link, source, and date
        """
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Prepare search parameters
            params = {
                "api_key": self.api_key,
                "engine": "google",
                "q": f"{symbol} stock news",
                "tbm": "nws",  # News search
                "num": 100,    # Number of results
                "tbs": f"cdr:1,cd_min:{start_date.strftime('%m/%d/%Y')},cd_max:{end_date.strftime('%m/%d/%Y')}"
            }
            
            # Execute search
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Process news results
            news_articles = []
            if "news_results" in results:
                for article in results["news_results"]:
                    news_item: SerpNewsItem = NewsSearchResult.from_serp_result(article)
                    news_articles.append(news_item.to_dict())
            
            
            '''save to dynamodb with symbol, search_date, news_items'''
            table_name = os.getenv("DYNAMODB_TABLE_NAME")
            if not table_name:
                raise NewsConfigurationError("DYNAMODB_TABLE_NAME not found in environment variables")
            
            table = boto3.resource('dynamodb').Table(table_name)
            table.put_item(Item={'type': 'stock_news','symbol': symbol, 'query': symbol,'search_date': datetime.now().isoformat(), 'news_items': news_articles})
                    
                    
            return news_articles
            
        except Exception as e:
            raise NewsAPIError(f"Error collecting news from SERP: {str(e)}")
            
    def validate_data(self, data: List[Dict[str, Any]]) -> bool:
        """
        Validate collected news data
        
        Args:
            data: List of collected news articles
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        if not isinstance(data, list):
            return False
            
        for article in data:
            required_fields = ["title", "link", "source", "date"]
            if not all(field in article for field in required_fields):
                return False
                
        return True
    