import json
from typing import Dict, Any
from stock_info_collector.collectors.news_collector.serp_news_collector import SerpNewsCollector
from stock_info_collector.collectors.news_collector.exceptions import NewsCollectorError, NewsConfigurationError, NewsAPIError
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for collecting stock news using SerpNewsCollector
    
    Args:
        event: AWS Lambda event object containing the request data
        context: AWS Lambda context object
        
    Returns:
        Dict containing the response with status code and either news data or error message
    """
    try:
        # Extract symbol directly from event (EventBridge format)
        symbol = event.get('symbol')
        days_back = event.get('days_back', 7)  # Optional parameter with default value

        if not symbol:
            return {
                'statusCode': 400,
                'error': 'Stock symbol is required'  # Removed json.dumps since EventBridge doesn't need it
            }

        # Initialize collector and collect news
        collector = SerpNewsCollector()
        news_data = collector.collect(symbol=symbol, days_back=days_back)
        logger.info(f"Collected news data: {json.dumps(news_data)}")

        return {
            'statusCode': 200,
            'data': {                    # Changed 'body' to 'data'
                'symbol': symbol,
                'news': news_data
            }
        }

    except (NewsConfigurationError, NewsCollectorError, NewsAPIError) as e:
        return {
            'statusCode': 500,
            'error': str(e)              # Simplified error response
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'error': f'Unexpected error: {str(e)}'  # Simplified error response
        }
