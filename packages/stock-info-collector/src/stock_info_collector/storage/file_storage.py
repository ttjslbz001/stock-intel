import json
import os
from datetime import datetime
from typing import Any, Dict, Optional

from .base import StorageSystem

class FileStorage(StorageSystem):
    """File-based storage system."""
    
    def __init__(self, base_dir: str = "./data"):
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
    
    def save(self, data: Any, data_type: str, metadata: Optional[Dict] = None) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{data_type}_{timestamp}.json"
        filepath = os.path.join(self.base_dir, filename)
        
        storage_data = {
            "data": data,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
            "data_type": data_type
        }
        
        with open(filepath, 'w') as f:
            json.dump(storage_data, f, indent=2)
        
        return filepath
    
    def load(self, identifier: str) -> Any:
        with open(identifier, 'r') as f:
            storage_data = json.load(f)
        return storage_data["data"] 