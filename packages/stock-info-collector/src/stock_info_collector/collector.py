from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta

from .storage.base import StorageSystem
from .storage.file_storage import FileStorage
from .collectors.price_collector import PriceCollector, TimeInterval, DateRange

class StockCollector:
    """Main class for collecting stock information from multiple sources."""
    
    def __init__(self, storage: Optional[StorageSystem] = None):
        """
        Initialize the collector with a storage system.
        
        Args:
            storage: Storage system to use. Defaults to FileStorage if None.
        """
        self.storage = storage or FileStorage()
        self.price_collector = PriceCollector()
    
    def get_stock_price(
        self,
        symbol: str,
        start_date: Optional[Union[str, datetime]] = None,
        interval: Union[str, TimeInterval] = TimeInterval.DAILY,
        include_extended_hours: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch stock price data with specified parameters.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            start_date: Start date for data collection (defaults to 1 month ago)
            interval: Time interval for data (defaults to daily)
            include_extended_hours: Whether to include pre/post market data
            
        Returns:
            Dictionary containing price data
        """
        # Set default start date to 1 month ago if not specified
        if start_date is None:
            start_date = datetime.now() - timedelta(days=30)
            
        # Convert string interval to TimeInterval enum if needed
        if isinstance(interval, str):
            interval = TimeInterval(interval)
            
        date_range = DateRange(start=start_date)
        
        # Collect price data
        data = self.price_collector.get_stock_price(
            symbol=symbol,
            date_range=date_range,
            interval=interval,
            include_extended_hours=include_extended_hours
        )
        
        # Store the data
        self.storage.save(
            data=data,
            data_type="price",
            metadata={
                "symbol": symbol,
                "interval": interval.value,
                "start_date": date_range.start.isoformat(),
                "end_date": date_range.end.isoformat()
            }
        )
        
        return data
    
    def get_stock_news(self, symbol: str) -> List[Dict[str, Any]]:
        """
        Collect news articles related to the stock.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            
        Returns:
            List of news articles
        """
        # TODO: Implement news collection from SERP
        data = [{
            "title": "Sample news",
            "timestamp": datetime.now().isoformat(),
            "source": "serp",
            "url": "",
            "summary": ""
        }]
        
        # Store the data
        self.storage.save(
            data=data,
            data_type="news",
            metadata={"symbol": symbol}
        )
        
        return data