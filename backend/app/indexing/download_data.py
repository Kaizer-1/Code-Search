import os
import re
import ast
import textwrap
import pandas as pd
from datasets import load_dataset
from loguru import logger
from app.config import settings


def strip_docstring_from_code(code: str) -> str:
    """
    Strip the docstring literal from function source code using AST so that the
    indexed text never contains the query text (queries = docstrings).

    Uses ast.unparse on the cleaned tree; falls back to a triple-quote regex when
    the source cannot be parsed (e.g. indented snippets that are not valid modules).
    """
    if not isinstance(code, str):
        return code
    try:
        tree = ast.parse(textwrap.dedent(code))
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if (
                    node.body
                    and isinstance(node.body[0], ast.Expr)
                    and isinstance(node.body[0].value, ast.Constant)
                    and isinstance(node.body[0].value.value, str)
                ):
                    node.body.pop(0)
                    if not node.body:
                        node.body.append(ast.Pass())
        return ast.unparse(tree)
    except Exception:
        # Regex fallback: strip the first triple-quoted literal in the function body
        code = re.sub(r'"""[\s\S]*?"""', '', code, count=1)
        code = re.sub(r"'''[\s\S]*?'''", '', code, count=1)
        return code


def clean_df(df):
    df = df.dropna(subset=['func_code_string', 'func_documentation_string'])
    df = df[df['func_documentation_string'].str.len() > 10]

    # Build indexed_code by stripping the docstring from the raw source.
    # func_code_tokens is derived from func_code_string and *includes* docstring
    # tokens, so we work from func_code_string directly to avoid data leakage.
    df['indexed_code'] = df['func_code_string'].apply(strip_docstring_from_code)
    
    df = df.rename(columns={
        'func_code_string': 'code',
        'func_documentation_string': 'docstring',
        'func_name': 'func_name',
        'repository_name': 'repo',
        'func_code_url': 'url'
    })
    df = df[['code', 'indexed_code', 'docstring', 'func_name', 'repo', 'url']]
    df['language'] = 'python'
    return df

def download_and_prepare_data():
    """
    Downloads CodeSearchNet Python splits separately, limits train size,
    and merges all into a unified corpus, while saving the test split separately for queries.
    """
    logger.info("Loading code_search_net splits from Hugging Face...")
    ds_train = load_dataset("code_search_net", "python", split="train", trust_remote_code=True)
    ds_valid = load_dataset("code_search_net", "python", split="validation", trust_remote_code=True)
    ds_test = load_dataset("code_search_net", "python", split="test", trust_remote_code=True)
    
    df_train = clean_df(ds_train.to_pandas())
    df_valid = clean_df(ds_valid.to_pandas())
    df_test = clean_df(ds_test.to_pandas())
    
    # Subsample to keep evaluation time under 10 minutes
    # 10k distractors from train, 1k test queries from test
    if len(df_train) > 10000:
        df_train = df_train.sample(n=10000, random_state=settings.SEED)
    if len(df_valid) > 2000:
        df_valid = df_valid.sample(n=2000, random_state=settings.SEED)
    if len(df_test) > 1000:
        df_test = df_test.sample(n=1000, random_state=settings.SEED)
        
    logger.info(f"Using {len(df_train)} train, {len(df_valid)} valid, {len(df_test)} test functions.")
    
    # Combine into unified corpus for indexing
    corpus_df = pd.concat([df_train, df_valid, df_test], ignore_index=True)
    corpus_df['id'] = [f"doc_{i}" for i in range(len(corpus_df))]
    
    # Update test_df to have the proper unified IDs
    test_df_with_ids = corpus_df.iloc[-len(df_test):].copy()
    
    # Save to disk
    index_path = settings.RAW_DATA_DIR / "corpus.parquet"
    test_path = settings.RAW_DATA_DIR / "test_queries.parquet"
    
    corpus_df.to_parquet(index_path, index=False)
    test_df_with_ids.to_parquet(test_path, index=False)
    
    logger.info(f"Saved {len(corpus_df)} total corpus functions to {index_path}")
    logger.info(f"Saved {len(test_df_with_ids)} test queries to {test_path}")

if __name__ == "__main__":
    download_and_prepare_data()
