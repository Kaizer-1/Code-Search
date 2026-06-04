# System Architecture

CodeSearch is a full-stack web application designed for hybrid semantic code retrieval. It features a modern React frontend and a FastAPI backend with a robust information retrieval pipeline.

## System Diagram

```mermaid
graph TD
    subgraph Frontend
        UI[React UI]
        SearchBar[Search Bar]
        Results[Results List]
        Dashboard[Eval Dashboard]
        
        UI --> SearchBar
        UI --> Results
        UI --> Dashboard
    end

    subgraph Backend API
        FastAPI[FastAPI Server]
        SearchRoute[/search]
        EvalRoute[/eval]
        ClusterRoute[/clusters]
        
        SearchBar -- POST query --> SearchRoute
        Dashboard -- GET --> EvalRoute
    end

    subgraph IR Pipeline
        Expander[TF-IDF Expander]
        Hybrid[Hybrid Retriever RRF]
        BM25[BM25 Retriever]
        Dense[Dense Retriever CodeBERT/MiniLM]
        
        SearchRoute --> Expander
        Expander -- expanded_query --> Hybrid
        Hybrid --> BM25
        Hybrid --> Dense
    end

    subgraph Data Layer
        BM25Idx[(BM25 Pickle)]
        FAISS[(FAISS IndexFlatIP)]
        KMeans[(K-Means Clusters)]
        Meta[(Parquet Metadata)]
        
        BM25 --> BM25Idx
        Dense --> FAISS
        ClusterRoute --> KMeans
        BM25 --> Meta
        Dense --> Meta
    end
```

## Information Retrieval Algorithms Map

| Algorithm | File Location | Purpose |
| :--- | :--- | :--- |
| **Code-aware Tokenization** | `backend/app/indexing/build_index.py` | Splits camelCase/snake_case and extracts alphanumeric identifiers for lexical indexing. |
| **BM25 (Okapi)** | `backend/app/retrieval/bm25_retriever.py` | Performs sparse/lexical retrieval based on exact token matching between query and document. |
| **Dense Embeddings** | `backend/app/indexing/build_index.py` | Encodes code and docstrings into dense vector space using Transformer models. |
| **Cosine Similarity Search** | `backend/app/retrieval/dense_retriever.py` | Fast nearest-neighbor search using FAISS `IndexFlatIP` (inner product on normalized vectors). |
| **Reciprocal Rank Fusion (RRF)** | `backend/app/retrieval/hybrid_retriever.py` | Combines ranks from BM25 and Dense retrievers without needing calibrated scores. |
| **Pseudo-relevance Feedback** | `backend/app/retrieval/tfidf_expander.py` | Computes TF-IDF on top BM25 results to extract keywords and expand the original query. |
| **K-Means Clustering** | `backend/app/clustering/kmeans_cluster.py` | Clusters function embeddings to provide "similar code" recommendations. |
