from langchain_community.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.docstore.document import Document
import json
import os
from dotenv import load_dotenv
load_dotenv()


def load_dataset(path="data/businesses.json"):
    with open(path, "r") as f:
        data = json.load(f)
    return [Document(page_content=f"{b['name']}, {b['category']}, {b['location']}, {b['description']}", metadata=b) for b in data]

def create_vector_store():
    docs = load_dataset()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
    return FAISS.from_documents(docs, embeddings)


vector_store = create_vector_store()