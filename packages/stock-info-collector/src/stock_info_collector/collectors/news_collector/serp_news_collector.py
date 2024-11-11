from typing import List, Dict, Any
from serpapi import GoogleSearch
from datetime import datetime, timedelta
import os
from .base_collector import BaseNewsCollector
from .exceptions import NewsCollectorError, NewsConfigurationError, NewsAPIError
from .search_result import NewsSearchResult

class SerpNewsCollector(BaseNewsCollector):
    """
    Collector for gathering stock-related news using SERP API
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the SERP news collector
        
        Args:
            api_key: SerpAPI key. If not provided, will try to get from environment variable SERPAPI_KEY
        """
        self.api_key = api_key or os.getenv("serp_api.api_key")
        if not self.api_key:
            raise NewsConfigurationError("SERPAPI_KEY not found in environment variables")

    def collect(self, symbol: str, days_back: int = 7) -> List[Dict[str, Any]]:
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
                    news_item = NewsSearchResult.from_serp_result(article)
                    news_articles.append(news_item.to_dict())
                    
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