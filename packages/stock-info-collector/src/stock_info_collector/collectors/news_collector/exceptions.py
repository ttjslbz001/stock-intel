class NewsCollectorError(Exception):
    """Base exception for news collector-related errors"""
    pass

class NewsValidationError(NewsCollectorError):
    """Exception raised when news data validation fails"""
    pass

class NewsConfigurationError(NewsCollectorError):
    """Exception raised when news collector configuration is invalid"""
    pass

class NewsAPIError(NewsCollectorError):
    """Exception raised when news API calls fail"""
    pass 