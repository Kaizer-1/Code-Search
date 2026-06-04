import pytest
from app.indexing.build_index import tokenize_code

def test_tokenize_code_empty():
    assert tokenize_code("") == []
    assert tokenize_code(None) == []

def test_tokenize_code_camel_case():
    assert tokenize_code("myCamelCaseFunction") == ["my", "camel", "case", "function"]

def test_tokenize_code_snake_case():
    assert tokenize_code("my_snake_case_var") == ["my", "snake", "case", "var"]

def test_tokenize_code_punctuation():
    assert tokenize_code("def my_func(arg1: int) -> str:") == ["def", "my", "func", "arg1", "int", "str"]
    
def test_tokenize_code_unicode():
    assert tokenize_code("print('héllo')") == ["print", "h", "llo"] # Re based tokenization behavior
