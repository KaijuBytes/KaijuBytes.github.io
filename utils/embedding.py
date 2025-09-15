from langchain_community.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.docstore.document import Document
import json

def load_dataset(path="data/businesses.json"):
    with open(path, "r") as f:
        data = json.load(f)
    return [Document(page_content=f"{b['name']}, {b['category']}, {b['location']}, {b['description']}", metadata=b) for b in data]

def create_vector_store():
    docs = load_dataset()
    embeddings = OpenAIEmbeddings()
    return FAISS.from_documents(docs, embeddings)

vector_store = create_vector_store()