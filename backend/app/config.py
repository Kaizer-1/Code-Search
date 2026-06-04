import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Define base directory (backend folder)
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "CodeSearch Engine"
    VERSION: str = "0.1.0"
    SEED: int = 42
    
    # Data paths
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    INDEX_DIR: Path = DATA_DIR / "index"
    
    # Index files
    BM25_INDEX_PATH: Path = INDEX_DIR / "bm25_index.pkl"
    CORPUS_METADATA_PATH: Path = INDEX_DIR / "corpus_metadata.parquet"
    FAISS_INDEX_PATH: Path = INDEX_DIR / "faiss_index.bin"
    CLUSTER_ASSIGNMENTS_PATH: Path = INDEX_DIR / "cluster_assignments.pkl"
    
    # Data parameters
    MAX_SAMPLES: int = 50000
    TEST_SET_SIZE: int = 1000
    
    # Dense retrieval model (swappable).
    # flax-sentence-embeddings/st-codesearch-distilroberta-base is a DistilRoBERTa
    # biencoder fine-tuned on CodeSearchNet for NL→code retrieval; microsoft/codebert-base
    # without retrieval fine-tuning collapses to near-random cosine similarities.
    DENSE_MODEL_NAME: str = os.getenv("DENSE_MODEL_NAME", "flax-sentence-embeddings/st-codesearch-distilroberta-base")
    
    # Retrieval parameters
    RRF_K: int = 60
    NUM_CLUSTERS: int = 50
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
settings.RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
