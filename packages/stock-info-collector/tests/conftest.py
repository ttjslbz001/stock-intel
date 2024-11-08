import os
import sys
from pathlib import Path

# Add the src directory to the Python path
src_path = str(Path(__file__).parent.parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)

# Add any shared fixtures here if needed
import pytest

@pytest.fixture
def sample_stock_data():
    return {
        "symbol": "AAPL",
        "prices": [
            {
                "timestamp": "2024-01-01T00:00:00",
                "open": 100.0,
                "high": 101.0,
                "low": 99.0,
                "close": 100.5,
                "volume": 1000000
            }
        ]
    } 