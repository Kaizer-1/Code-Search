import numpy as np

def mrr(results: list, relevant: set) -> float:
    """
    Mean Reciprocal Rank.
    Finds the rank of the first relevant document and returns 1/rank.
    """
    for rank, res in enumerate(results):
        if res.id in relevant:
            return 1.0 / (rank + 1)
    return 0.0

def ndcg_at_k(results: list, relevant: set, k: int = 10) -> float:
    """
    Normalized Discounted Cumulative Gain at K.
    Binary relevance (1 if in relevant set, 0 otherwise).
    """
    dcg = 0.0
    for i, res in enumerate(results[:k]):
        if res.id in relevant:
            dcg += 1.0 / np.log2(i + 2) # i+2 because rank is 1-indexed and log2(1) = 0
            
    # Ideal DCG (all relevant items at the top)
    idcg = 0.0
    num_relevant_in_top_k = min(len(relevant), k)
    for i in range(num_relevant_in_top_k):
        idcg += 1.0 / np.log2(i + 2)
        
    if idcg == 0.0:
        return 0.0
        
    return dcg / idcg

def recall_at_k(results: list, relevant: set, k: int = 10) -> float:
    """
    Recall at K.
    Number of relevant documents in top K / Total relevant documents.
    For this project, there's usually only 1 relevant document per query (the ground truth),
    so this is essentially Hit@K.
    """
    if not relevant:
        return 0.0
        
    relevant_in_k = 0
    for res in results[:k]:
        if res.id in relevant:
            relevant_in_k += 1
            
    return float(relevant_in_k) / len(relevant)
