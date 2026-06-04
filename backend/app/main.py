import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import pandas as pd

from app.schemas import SearchRequest, SearchResponse, SearchResult
from app.config import settings

# Load all retrievers
from app.retrieval.bm25_retriever import BM25Retriever
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.hybrid_retriever import HybridRetriever
from app.retrieval.tfidf_expander import TfidfExpander

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global retrievers dict
retrievers = {}

@app.on_event("startup")
def startup_event():
    logger.info("Starting up CodeSearch API...")
    try:
        bm25 = BM25Retriever()
        dense = DenseRetriever()
        hybrid = HybridRetriever(bm25, dense)
        expander = TfidfExpander(bm25)
        
        retrievers['bm25'] = bm25
        retrievers['dense'] = dense
        retrievers['hybrid'] = hybrid
        retrievers['expander'] = expander
        
        logger.info("All Retrievers loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load retrievers: {e}")
        # Not raising here to allow app to start even if indexes aren't built yet
        # (useful for first-time setup)

@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    start_time = time.time()
    
    if request.mode not in retrievers:
        raise HTTPException(status_code=400, detail=f"Mode '{request.mode}' not supported or not loaded.")
        
    search_query = request.query
    expanded_query = None
    
    if request.expand_query:
        if 'expander' in retrievers:
            expanded_query = retrievers['expander'].expand_query(search_query)
            search_query = expanded_query
            logger.info(f"Expanded query to: {search_query}")
    
    retriever = retrievers[request.mode]
    results = retriever.search(search_query, request.k)
    
    latency_ms = (time.time() - start_time) * 1000
    
    return SearchResponse(
        query=request.query,
        results=results,
        latency_ms=latency_ms,
        expanded_query=expanded_query
    )

@app.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: int):
    # Quick implementation to get some samples from the cluster
    try:
        retriever = retrievers.get('bm25')
        if not retriever:
            return []
            
        assignments = retriever.cluster_assignments
        metadata_df = retriever.metadata_df
        
        # Find doc IDs for this cluster
        doc_ids = [doc_id for doc_id, c_id in assignments.items() if c_id == cluster_id]
        
        # Get up to 5 samples
        sample_ids = doc_ids[:5]
        
        samples = []
        for doc_id in sample_ids:
            row = metadata_df[metadata_df['id'] == doc_id].iloc[0]
            samples.append({
                "id": row['id'],
                "func_name": row['func_name'],
                "code": row['code'],
                "docstring": row['docstring']
            })
            
        return samples
    except Exception as e:
        logger.error(f"Error fetching cluster {cluster_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching cluster")

@app.get("/eval")
def get_eval():
    try:
        import json
        from app.config import BASE_DIR
        with open(BASE_DIR / "eval_results.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Evaluation results not found. Run evaluate.py first."}

@app.get("/health")
def health():
    return {"status": "ok", "loaded_retrievers": list(retrievers.keys())}
