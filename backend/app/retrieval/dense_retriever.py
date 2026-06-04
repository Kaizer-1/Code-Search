import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from app.retrieval.base import Retriever
from app.schemas import SearchResult
from app.config import settings
from loguru import logger

class DenseRetriever(Retriever):
    def __init__(self):
        super().__init__()
        logger.info(f"Loading FAISS index from {settings.FAISS_INDEX_PATH}")
        self.faiss_index = faiss.read_index(str(settings.FAISS_INDEX_PATH))
        
        logger.info(f"Loading dense model: {settings.DENSE_MODEL_NAME}")
        self.model = SentenceTransformer(settings.DENSE_MODEL_NAME)
        
    def search(self, query: str, k: int = 10) -> list[SearchResult]:
        if not query.strip():
            return []
            
        # Encode query
        query_embedding = self.model.encode([query], convert_to_numpy=True)
        # Normalize for Inner Product (Cosine Similarity)
        faiss.normalize_L2(query_embedding)
        
        # Search index
        scores, indices = self.faiss_index.search(query_embedding, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            score = float(scores[0][i])
            results.append(self._build_result(int(idx), score, breakdown={"dense_score": score}))
            
        return results
