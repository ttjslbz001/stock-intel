import pytest
from stock_info_collector import StockCollector

def test_stock_collector_initialization():
    collector = StockCollector()
    assert collector is not None

def test_get_stock_price():
    collector = StockCollector()
    price_data = collector.get_stock_price("AAPL")
    assert isinstance(price_data, dict)
    assert "symbol" in price_data
    assert "timestamp" in price_data
    assert "price" in price_data

def test_get_stock_news():
    collector = StockCollector()
    news_data = collector.get_stock_news("AAPL")
    assert isinstance(news_data, list)
    assert len(news_data) >= 0
    if news_data:
        assert "title" in news_data[0]
        assert "timestamp" in news_data[0] 