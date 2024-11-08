from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class TimeInterval(Enum):
    """Time intervals for stock data collection."""
    FIVE_MINUTES = "5m"
    HOUR = "1h"
    DAILY = "1d"
    MONTHLY = "1mo"

class DateRange:
    """Date range for data collection."""
    def __init__(self, start: Union[str, datetime], end: Optional[Union[str, datetime]] = None):
        self.start = pd.to_datetime(start) if isinstance(start, str) else start
        self.end = pd.to_datetime(end) if isinstance(end, str) and end else end or datetime.now()

class PriceCollector:
    """Collector specifically for stock price data."""
    
    @staticmethod
    def get_stock_price(
        symbol: str,
        date_range: DateRange,
        interval: TimeInterval,
        include_extended_hours: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch detailed stock price data from Yahoo Finance.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            date_range: Date range for the data
            interval: Time interval for the data
            include_extended_hours: Whether to include pre/post market data
            
        Returns:
            Dictionary containing price data with the following structure:
            {
                "symbol": str,
                "interval": str,
                "start_date": str,
                "end_date": str,
                "prices": List[Dict],
                "metadata": Dict
            }
        """
        try:
            # Initialize yfinance ticker
            ticker = yf.Ticker(symbol)
            
            # Get historical data
            df = ticker.history(
                start=date_range.start,
                end=date_range.end,
                interval=interval.value,
                prepost=include_extended_hours
            )
            
            # Convert the data to our format
            prices = []
            
            # if df is empty, return an empty list and log a warning
            if df.empty:
                    # Start Generation Here
                logger.warning(f"No data found for {symbol} in the date range {date_range.start} to {date_range.end}")
                return {
                    "symbol": symbol,
                    "interval": interval.value,
                    "start_date": date_range.start.isoformat(),
                    "end_date": date_range.end.isoformat(),
                    "prices": [],
                    "metadata": {}
                }   
            
            for index, row in df.iterrows():
                price_point = {
                    "timestamp": index.isoformat(),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"]),
                    "is_extended_hours": bool(include_extended_hours and 
                        (index.time() < pd.Timestamp("09:30").time() or 
                         index.time() > pd.Timestamp("16:00").time()))
                }
                prices.append(price_point)
            
            # Get additional ticker info
            info = ticker.info
            
            return {
                "symbol": symbol,
                "interval": interval.value,
                "start_date": date_range.start.isoformat(),
                "end_date": date_range.end.isoformat(),
                "prices": prices,
                "metadata": {
                    "currency": info.get("currency", "USD"),
                    "exchange": info.get("exchange", ""),
                    "timezone": info.get("timeZone", ""),
                    "company_name": info.get("longName", ""),
                    "sector": info.get("sector", ""),
                    "industry": info.get("industry", "")
                }
            }
            
        except Exception as e:
            raise ValueError(f"Failed to fetch stock price data for {symbol}: {str(e)}") 