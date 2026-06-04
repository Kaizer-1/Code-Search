import pickle
import numpy as np
from app.retrieval.base import Retriever
from app.schemas import SearchResult
from app.config import settings
from app.indexing.build_index import tokenize_code

class BM25Retriever(Retriever):
    def __init__(self):
        super().__init__()
        with open(settings.BM25_INDEX_PATH, 'rb') as f:
            self.bm25 = pickle.load(f)
            
    def search(self, query: str, k: int = 10) -> list[SearchResult]:
        if not query.strip():
            return []
            
        tokenized_query = tokenize_code(query)
        if not tokenized_query:
            return []
            
        scores = self.bm25.get_scores(tokenized_query)
        
        # Get top k indices
        top_k_indices = np.argsort(scores)[::-1][:k]
        
        results = []
        for idx in top_k_indices:
            score = float(scores[idx])
            if score <= 0:
                continue
            results.append(self._build_result(idx, score, breakdown={"bm25_score": score}))
            
        return results
