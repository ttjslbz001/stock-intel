from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime

class StorageSystem(ABC):
    """Abstract base class for storage systems."""
    
    @abstractmethod
    def save(self, data: Any, data_type: str, metadata: Optional[Dict] = None) -> str:
        """
        Save data to storage.
        
        Args:
            data: Data to store
            data_type: Type of data being stored
            metadata: Optional metadata about the data
            
        Returns:
            str: Identifier for the stored data
        """
        pass
    
    @abstractmethod
    def load(self, identifier: str) -> Any:
        """
        Load data from storage.
        
        Args:
            identifier: Unique identifier for the data
            
        Returns:
            The stored data
        """
        pass 