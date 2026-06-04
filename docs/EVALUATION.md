# Evaluation Methodology

This project evaluates the performance of three retrieval modes (Lexical, Semantic, Hybrid) using a random subset of 1,000 queries from the official test split.

## Test Set Construction
- The `code_search_net` Python dataset is downloaded using the official Hugging Face splits (`train`, `validation`, `test`).
- The indexed corpus consists of **13,000 code documents**: 10,000 sampled from `train`, 2,000 from `validation`, and 1,000 from `test`. All splits are indexed together so the 1,000 test documents are present as retrieval targets amid 12,000 distractors.
- Docstrings are stripped from the indexed representation using AST before any tokenization or embedding. The BM25 and Dense indexes encode **only the code** (and function names), preventing trivial textual matching between the query and the indexed document. See `download_data.py::strip_docstring_from_code`.
- The test queries are the full natural language `docstring` of the 1,000 test-split functions.
- The corresponding `id` of each function is the single relevant ground truth document for its query.

## Results (1,000 test queries, 13,000-document corpus)

| Mode   | MRR    | NDCG@10 | Recall@10 | P50 latency | P95 latency |
|--------|--------|---------|-----------|-------------|-------------|
| BM25   | 0.6493 | 0.6800  | 0.7760    | 25 ms       | 160 ms      |
| Dense  | 0.7574 | 0.7882  | 0.8840    | 14 ms       | 38 ms       |
| Hybrid | 0.7823 | 0.8085  | 0.8910    | 44 ms       | 176 ms      |

Hybrid strictly outperforms both base modes on all three metrics, validating the RRF fusion. Dense outperforms BM25 because `flax-sentence-embeddings/st-codesearch-distilroberta-base` was trained on CodeSearchNet for NL→code retrieval and captures semantic intent that keyword matching misses.

**Sanity checks passed:**
- BM25 MRR is 0.65, not > 0.95 (confirms docstrings are no longer in the indexed text)
- Dense MRR is 0.76, not near-zero (confirms the model produces meaningful code embeddings)
- Hybrid > Dense > BM25 on all metrics (confirms RRF fusion is working correctly)

## Metrics

We implemented the following IR metrics manually in `backend/app/evaluation/metrics.py`.

### 1. Mean Reciprocal Rank (MRR)
MRR evaluates the rank of the first relevant document returned. Since we have exactly one relevant document per query, this is the primary metric.

**Formula:**
MRR = $\frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$

### 2. Normalized Discounted Cumulative Gain (NDCG@K)
NDCG measures the usefulness (gain) of a document based on its position in the result list.

**Formula:**
DCG@K = $\sum_{i=1}^{K} \frac{rel_i}{\log_2(i + 1)}$

Since relevance is binary (1 or 0), $rel_i$ is 1 if the document is the ground truth. We normalize this by the Ideal DCG (IDCG), which would have the relevant document at rank 1.

### 3. Recall@K
Recall measures whether the relevant document appeared anywhere in the top K results.

**Formula:**
Recall@K = $\frac{\text{Relevant in Top K}}{\text{Total Relevant}}$

## Running Evaluation
Run the evaluation script to process all 1,000 queries against all retrievers:
```bash
cd backend
python app/evaluation/evaluate.py
```
This will output `eval_results.json` which is visualized by the frontend Dashboard.
