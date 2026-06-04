from pydantic import BaseModel
from typing import Literal, Optional

class SearchRequest(BaseModel):
    query: str
    mode: Literal["bm25", "dense", "hybrid"] = "bm25"
    k: int = 10
    expand_query: bool = False

class SearchResult(BaseModel):
    id: str
    func_name: str
    code: str
    docstring: str
    repo: str
    url: str
    score: float
    cluster_id: Optional[int] = None
    breakdown: Optional[dict[str, float]] = None

class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    latency_ms: float
    expanded_query: Optional[str] = None
