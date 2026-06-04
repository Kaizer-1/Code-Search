import time
import json
import pandas as pd
import numpy as np
from loguru import logger
from app.config import settings
from app.retrieval.bm25_retriever import BM25Retriever
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.hybrid_retriever import HybridRetriever
from app.evaluation.metrics import mrr, ndcg_at_k, recall_at_k

def run_evaluation():
    logger.info("Loading test queries...")
    test_df = pd.read_parquet(settings.RAW_DATA_DIR / "test_queries.parquet")
    # Subsample test queries for evaluation speed
    if len(test_df) > 1000:
        test_df = test_df.sample(n=1000, random_state=42)
    
    # In CodeSearchNet, the docstring can serve as a natural language query
    # We use the first sentence of the docstring as the query, and the code as the target
    queries = []
    ground_truths = []
    
    for _, row in test_df.iterrows():
        # Use the full docstring as the query
        docstring = row['docstring']
        query = docstring.strip()
        
        if len(query) > 10:
            queries.append(query)
            ground_truths.append({row['id']}) # A set of relevant IDs (just one in our case)
            
    logger.info(f"Prepared {len(queries)} evaluation queries.")
    
    logger.info("Loading retrievers...")
    bm25 = BM25Retriever()
    dense = DenseRetriever()
    hybrid = HybridRetriever(bm25, dense)
    
    modes = {
        "bm25": bm25,
        "dense": dense,
        "hybrid": hybrid
    }
    
    results_report = {}
    
    for mode_name, retriever in modes.items():
        logger.info(f"Evaluating {mode_name}...")
        
        mrr_scores = []
        ndcg_scores = []
        recall_scores = []
        latencies = []
        
        for query, relevant_set in zip(queries, ground_truths):
            start = time.time()
            results = retriever.search(query, k=10)
            latency = (time.time() - start) * 1000
            latencies.append(latency)
            
            mrr_scores.append(mrr(results, relevant_set))
            ndcg_scores.append(ndcg_at_k(results, relevant_set, k=10))
            recall_scores.append(recall_at_k(results, relevant_set, k=10))
            
        results_report[mode_name] = {
            "mrr": float(np.mean(mrr_scores)),
            "ndcg_10": float(np.mean(ndcg_scores)),
            "recall_10": float(np.mean(recall_scores)),
            "latency_p50": float(np.percentile(latencies, 50)),
            "latency_p95": float(np.percentile(latencies, 95))
        }
        
    logger.info("Evaluation complete.")
    
    from app.config import BASE_DIR
    out_path = BASE_DIR / "eval_results.json"
    with open(out_path, "w") as f:
        json.dump(results_report, f, indent=2)
        
    logger.info(f"Saved evaluation results to {out_path}")
    for mode, metrics in results_report.items():
        logger.info(f"--- {mode.upper()} ---")
        for k, v in metrics.items():
            logger.info(f"  {k}: {v:.4f}")

if __name__ == "__main__":
    run_evaluation()
