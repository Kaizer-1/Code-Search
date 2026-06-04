from app.retrieval.base import Retriever
from app.retrieval.bm25_retriever import BM25Retriever
from app.retrieval.dense_retriever import DenseRetriever
from app.schemas import SearchResult
from app.config import settings

class HybridRetriever(Retriever):
    def __init__(self, bm25_retriever: BM25Retriever, dense_retriever: DenseRetriever):
        super().__init__()
        self.bm25_retriever = bm25_retriever
        self.dense_retriever = dense_retriever
        self.k_rrf = settings.RRF_K
        
    def search(self, query: str, k: int = 10) -> list[SearchResult]:
        # Get top 100 from both
        # Reciprocal Rank Fusion works best with a larger pool than final k
        pool_size = max(100, k * 2)
        
        bm25_results = self.bm25_retriever.search(query, k=pool_size)
        dense_results = self.dense_retriever.search(query, k=pool_size)
        
        # Calculate RRF scores
        rrf_scores = {}
        result_map = {}
        breakdown_map = {}
        
        # Add BM25 ranks
        for rank, res in enumerate(bm25_results):
            doc_id = res.id
            score = 1.0 / (self.k_rrf + rank + 1)
            rrf_scores[doc_id] = score
            result_map[doc_id] = res
            breakdown_map[doc_id] = {"bm25_rank": rank + 1, "bm25_score": res.score, "dense_rank": -1, "dense_score": 0.0}
            
        # Add Dense ranks
        for rank, res in enumerate(dense_results):
            doc_id = res.id
            score = 1.0 / (self.k_rrf + rank + 1)
            if doc_id in rrf_scores:
                rrf_scores[doc_id] += score
                breakdown_map[doc_id]["dense_rank"] = rank + 1
                breakdown_map[doc_id]["dense_score"] = res.score
            else:
                rrf_scores[doc_id] = score
                result_map[doc_id] = res
                breakdown_map[doc_id] = {"bm25_rank": -1, "bm25_score": 0.0, "dense_rank": rank + 1, "dense_score": res.score}
                
        # Sort by RRF score
        sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:k]
        
        # Build final results
        final_results = []
        for doc_id in sorted_ids:
            res = result_map[doc_id]
            breakdown = breakdown_map[doc_id]
            breakdown["rrf_score"] = rrf_scores[doc_id]
            
            # Create a new result with the fused score and breakdown
            final_res = SearchResult(
                id=res.id,
                func_name=res.func_name,
                code=res.code,
                docstring=res.docstring,
                repo=res.repo,
                url=res.url,
                score=rrf_scores[doc_id],
                cluster_id=res.cluster_id,
                breakdown=breakdown
            )
            final_results.append(final_res)
            
        return final_results
