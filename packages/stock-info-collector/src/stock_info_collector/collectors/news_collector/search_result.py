from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class NewsSearchResult:
    """
    Unified structure for news search results
    """
    title: str
    link: str
    source: str
    date: str
    snippet: Optional[str] = None
    collected_at: str = None

    def __post_init__(self):
        if self.collected_at is None:
            self.collected_at = datetime.now().isoformat()

    @classmethod
    def from_serp_result(cls, article: dict) -> 'NewsSearchResult':
        """
        Create NewsSearchResult from SERP API result
        
        Args:
            article: Dictionary containing SERP API article data
            
        Returns:
            NewsSearchResult object
        """
        return cls(
            title=article.get("title", ""),
            link=article.get("link", ""),
            source=article.get("source", ""),
            date=article.get("date", ""),
            snippet=article.get("snippet", ""),
        )

    def to_dict(self) -> dict:
        """
        Convert the search result to a dictionary
        
        Returns:
            Dictionary representation of the news search result
        """
        return {
            "title": self.title,
            "link": self.link,
            "source": self.source,
            "date": self.date,
            "snippet": self.snippet,
            "collected_at": self.collected_at
        } 