from abc import ABC, abstractmethod
from app.schemas import SearchResult
import pandas as pd
import pickle
from app.config import settings

class Retriever(ABC):
    def __init__(self):
        # Load metadata and clusters
        self.metadata_df = pd.read_parquet(settings.CORPUS_METADATA_PATH)
        with open(settings.CLUSTER_ASSIGNMENTS_PATH, 'rb') as f:
            self.cluster_assignments = pickle.load(f)

    def _build_result(self, idx: int, score: float, breakdown: dict = None) -> SearchResult:
        row = self.metadata_df.iloc[idx]
        doc_id = row['id']
        return SearchResult(
            id=doc_id,
            func_name=row['func_name'],
            code=row['code'],
            docstring=row['docstring'],
            repo=row['repo'],
            url=row['url'],
            score=score,
            cluster_id=self.cluster_assignments.get(doc_id),
            breakdown=breakdown
        )

    @abstractmethod
    def search(self, query: str, k: int = 10) -> list[SearchResult]:
        pass
