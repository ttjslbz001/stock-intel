from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseNewsCollector(ABC):
    """
    Abstract base class for news collectors
    """
    
    @abstractmethod
    def collect(self, symbol: str, *args, **kwargs) -> List[Dict[str, Any]]:
        """
        Collect news data for a given stock symbol
        
        Args:
            symbol: Stock symbol to collect news for
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments
            
        Returns:
            List of news articles with title, link, source, and date
        """
        pass
    
    @abstractmethod
    def validate_data(self, data: List[Dict[str, Any]]) -> bool:
        """
        Validate collected news data
        
        Args:
            data: List of collected news articles
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        pass 