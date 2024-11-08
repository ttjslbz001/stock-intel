# Stock Info Collector

A Python package designed to collect and archive comprehensive stock market information from multiple data sources.

## Features

- **Multi-source Data Collection**
  - Yahoo Finance
  - SERP (Search Engine Results)
  - AKShare

- **Data Types**
  - Stock price data
  - Market news and updates
  - Historical trends

## Installation
pip install stock-info-collector

python
from py_stock_collector import StockCollector

## Initialize collector

collector = StockCollector()

## Fetch stock price
price_data = collector.get_stock_price("AAPL")
## Collect news
news_data = collector.get_stock_news("AAPL")

## Archive data
collector.archive_data(price_data, "price")
collector.archive_data(news_data, "news")
