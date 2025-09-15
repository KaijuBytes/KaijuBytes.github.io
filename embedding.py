import os
import json
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Define the path where the vector store will be saved
VECTOR_STORE_PATH = "faiss_index"

# Load environment variables
load_dotenv()

def load_dataset(path="data/businesses.json"):
    """Loads the business dataset from a JSON file."""
    try:
        with open(path, "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{path}' was not found.")
        return []

    docs = []
    for business in data:
        full_text = f"Name: {business['name']}\nCategory: {business['category']}\nLocation: {business['location']}\nDescription: {business['description']}\nStars: {business['stars']}"
        docs.append(Document(page_content=full_text, metadata=business))
    return docs

def create_or_load_vector_store():
    """Creates a new vector store or loads an existing one from disk."""
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=model_name)

    if os.path.exists(VECTOR_STORE_PATH):
        print("Loading existing vector store from disk...")
        return FAISS.load_local(
            VECTOR_STORE_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
    else:
        print("Creating a new vector store...")
        docs = load_dataset()
        if not docs:
            return None
        vector_store = FAISS.from_documents(docs, embeddings)
        vector_store.save_local(VECTOR_STORE_PATH)
        print(f"Vector store saved to '{VECTOR_STORE_PATH}'.")
        return vector_store

# This block will run when you execute `python embedding.py`
if __name__ == "__main__":
    create_or_load_vector_store()