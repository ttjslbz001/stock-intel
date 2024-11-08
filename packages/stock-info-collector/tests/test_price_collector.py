import pytest
from datetime import datetime, timedelta
from stock_info_collector.collectors.price_collector import PriceCollector, TimeInterval, DateRange

def test_price_collector_basic(sample_stock_data):
    collector = PriceCollector()
    date_range = DateRange(
        start=datetime.now() - timedelta(days=7),
        end=datetime.now()
    )
    
    data = collector.get_stock_price(
        symbol="AAPL",
        date_range=date_range,
        interval=TimeInterval.DAILY
    )
    
    assert isinstance(data, dict)
    assert data["symbol"] == "AAPL"
    assert data["interval"] == TimeInterval.DAILY.value
    assert len(data["prices"]) > 0
    assert all(required in data["prices"][0] 
              for required in ["timestamp", "open", "high", "low", "close", "volume"])

def test_price_collector_intervals():
    collector = PriceCollector()
    date_range = DateRange(
        start=datetime.now() - timedelta(days=1)
    )
    
    # Test 5-minute intervals
    data = collector.get_stock_price(
        symbol="AAPL",
        date_range=date_range,
        interval=TimeInterval.FIVE_MINUTES
    )
    assert data["interval"] == TimeInterval.FIVE_MINUTES.value

def test_invalid_symbol():
    collector = PriceCollector()
    date_range = DateRange(
        start=datetime.now() - timedelta(days=1)
    )
    
    data = collector.get_stock_price(
        symbol="INVALID_SYMBOL_123",
        date_range=date_range,
        interval=TimeInterval.DAILY
    )
    
    assert data["symbol"] == "INVALID_SYMBOL_123"
    assert data["interval"] == TimeInterval.DAILY.value
    assert len(data["prices"]) == 0