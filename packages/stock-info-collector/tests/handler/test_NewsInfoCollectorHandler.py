import pytest
from src.handler.NewsInfoCollectorHandler import handler
import json
from dotenv import load_dotenv
import os

def test_handler():
    # Load environment variables from .env.local
    load_dotenv('.env.local')
    
    event = json.loads('{"symbol": "AAPL", "days_back": 7}')
    assert handler(event, {}) == {}