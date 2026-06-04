from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import pandas as pd
from app.config import settings

class TfidfExpander:
    def __init__(self, bm25_retriever):
        self.bm25_retriever = bm25_retriever
        # We need a TF-IDF vectorizer over the corpus to find important terms
        self.vectorizer = TfidfVectorizer(max_df=0.85, min_df=2, stop_words='english')
        
        # Fit vectorizer on a subset of the corpus for speed
        corpus_df = pd.read_parquet(settings.RAW_DATA_DIR / "corpus.parquet")
        sample_texts = (corpus_df['docstring'] + " " + corpus_df['code']).sample(n=min(10000, len(corpus_df)), random_state=settings.SEED).tolist()
        self.vectorizer.fit(sample_texts)
        self.feature_names = self.vectorizer.get_feature_names_out()

    def expand_query(self, query: str, top_k_docs: int = 5, top_k_terms: int = 3) -> str:
        """
        Performs pseudo-relevance feedback:
        1. Retrieves top-k documents using BM25
        2. Extracts TF-IDF keywords from these documents
        3. Appends top terms to the original query
        """
        results = self.bm25_retriever.search(query, k=top_k_docs)
        if not results:
            return query
            
        # Combine text of top documents
        feedback_docs = [res.docstring + " " + res.code for res in results]
        
        # Compute TF-IDF over these documents
        tfidf_matrix = self.vectorizer.transform(feedback_docs)
        
        # Sum TF-IDF scores across documents
        summed_tfidf = np.asarray(tfidf_matrix.sum(axis=0)).flatten()
        
        # Find top k terms
        top_indices = summed_tfidf.argsort()[::-1]
        
        expanded_terms = []
        query_terms = set(query.lower().split())
        
        for idx in top_indices:
            term = self.feature_names[idx]
            # Add term if it's not already in the query and consists of letters
            if term not in query_terms and term.isalpha():
                expanded_terms.append(term)
                if len(expanded_terms) == top_k_terms:
                    break
                    
        if not expanded_terms:
            return query
            
        expanded_query = query + " " + " ".join(expanded_terms)
        return expanded_query
