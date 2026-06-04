import pickle
import faiss
import numpy as np
from sklearn.cluster import KMeans
from loguru import logger
from app.config import settings
import pandas as pd

def cluster_embeddings():
    """
    Reads the FAISS index (which contains the normalized dense embeddings),
    runs K-Means clustering, and persists the cluster assignments.
    """
    logger.info(f"Loading FAISS index from {settings.FAISS_INDEX_PATH}")
    faiss_index = faiss.read_index(str(settings.FAISS_INDEX_PATH))
    
    # Extract embeddings from the IndexFlatIP
    # Note: For IndexFlat, we can reconstruct the vectors
    n_total = faiss_index.ntotal
    dim = faiss_index.d
    
    logger.info(f"Reconstructing {n_total} vectors of dimension {dim}...")
    embeddings = np.zeros((n_total, dim), dtype=np.float32)
    for i in range(n_total):
        embeddings[i] = faiss_index.reconstruct(i)
        
    logger.info(f"Running K-Means with k={settings.NUM_CLUSTERS} (this may take a moment)...")
    kmeans = KMeans(n_clusters=settings.NUM_CLUSTERS, random_state=settings.SEED, n_init='auto')
    
    # Fit and predict
    cluster_labels = kmeans.fit_predict(embeddings)
    
    # Save the cluster assignments mapped to original ids
    metadata_df = pd.read_parquet(settings.CORPUS_METADATA_PATH)
    
    # Ensure they line up
    assert len(metadata_df) == len(cluster_labels)
    
    cluster_mapping = dict(zip(metadata_df['id'], cluster_labels))
    
    logger.info(f"Saving cluster assignments to {settings.CLUSTER_ASSIGNMENTS_PATH}")
    with open(settings.CLUSTER_ASSIGNMENTS_PATH, 'wb') as f:
        pickle.dump(cluster_mapping, f)
        
    logger.info("Clustering complete.")

if __name__ == "__main__":
    cluster_embeddings()
