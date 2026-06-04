import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
import re
import pickle
import faiss
import pandas as pd
import numpy as np
from loguru import logger
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from app.config import settings

def tokenize_code(text: str) -> list[str]:
    """
    Code-aware tokenization:
    - Splits camelCase and snake_case
    - Strips punctuation, keeps alphanumeric identifiers
    - Lowercases all tokens
    """
    if not isinstance(text, str):
        return []
    
    # Split snake_case and keep alphanumeric
    tokens = re.findall(r'[a-zA-Z0-9]+', text)
    
    result = []
    for token in tokens:
        # Split camelCase
        camel_splits = re.sub(r'([A-Z][a-z]+)', r' \1', re.sub(r'([A-Z]+)', r' \1', token)).split()
        for t in camel_splits:
            if len(t) > 1:
                result.append(t.lower())
    
    return result

def build_indexes():
    """
    Builds both BM25 and FAISS dense indexes over the corpus.
    """
    corpus_path = settings.RAW_DATA_DIR / "corpus.parquet"
    logger.info(f"Loading corpus from {corpus_path}")
    df = pd.read_parquet(corpus_path)
    
    # --- 1. Build BM25 Index ---
    logger.info("Tokenizing corpus for BM25...")
    # Tokenize only func_name and indexed_code to avoid trivial docstring matches
    corpus_texts = df['func_name'] + " " + df['indexed_code']
    tokenized_corpus = [tokenize_code(text) for text in corpus_texts]
    
    logger.info("Building BM25Okapi index...")
    bm25 = BM25Okapi(tokenized_corpus)
    
    logger.info(f"Saving BM25 index to {settings.BM25_INDEX_PATH}")
    with open(settings.BM25_INDEX_PATH, 'wb') as f:
        pickle.dump(bm25, f)
        
    # --- 2. Build Dense (FAISS) Index ---
    logger.info(f"Loading sentence-transformer: {settings.DENSE_MODEL_NAME}")
    model = SentenceTransformer(settings.DENSE_MODEL_NAME)
    
    logger.info("Encoding corpus (this might take a few minutes)...")
    # We embed only the indexed_code (and func_name implicitly inside it)
    texts_to_embed = df['indexed_code'].tolist()
    
    # encode yields a numpy array
    embeddings = model.encode(texts_to_embed, batch_size=32, show_progress_bar=True, convert_to_numpy=True)
    
    # Normalize vectors for Inner Product (Cosine Similarity)
    faiss.normalize_L2(embeddings)
    dim = embeddings.shape[1]
    
    logger.info(f"Building FAISS IndexFlatIP of dimension {dim}...")
    faiss_index = faiss.IndexFlatIP(dim)
    faiss_index.add(embeddings)
    
    logger.info(f"Saving FAISS index to {settings.FAISS_INDEX_PATH}")
    faiss.write_index(faiss_index, str(settings.FAISS_INDEX_PATH))
    
    # --- 3. Save Metadata ---
    logger.info(f"Saving corpus metadata to {settings.CORPUS_METADATA_PATH}")
    # We save the dataframe to map index positions back to document IDs
    df.to_parquet(settings.CORPUS_METADATA_PATH, index=False)
    
    logger.info("Indexing complete.")

if __name__ == "__main__":
    build_indexes()
