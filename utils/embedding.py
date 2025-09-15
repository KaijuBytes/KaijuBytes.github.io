# OPENAI
# from langchain_community.embeddings import OpenAIEmbeddings
# from langchain.vectorstores import FAISS
# from langchain.docstore.document import Document
# import json
# import os
# from dotenv import load_dotenv
# load_dotenv()


# def load_dataset(path="data/businesses.json"):
#     with open(path, "r") as f:
#         data = json.load(f)
#     return [Document(page_content=f"{b['name']}, {b['category']}, {b['location']}, {b['description']}", metadata=b) for b in data]

# def create_vector_store():
#     docs = load_dataset()
#     openai_api_key = os.getenv("OPENAI_API_KEY")
#     embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
#     return FAISS.from_documents(docs, embeddings)


# vector_store = create_vector_store()


# #GOOGLE AI STUDIO
# import os
# from dotenv import load_dotenv
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain.vectorstores import FAISS
# from langchain.docstore.document import Document
# import json

# load_dotenv()

# def load_dataset(path="data/businesses.json"):
#     with open(path, "r") as f:
#         data = json.load(f)
#     return [Document(page_content=f"{b['name']}, {b['category']}, {b['location']}, {b['description']}", metadata=b) for b in data]

# def create_vector_store():
#     api_key = os.getenv("GOOGLE_API_KEY")
#     embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
#     docs = load_dataset()
#     return FAISS.from_documents(docs, embeddings)

# vector_store = create_vector_store()

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.docstore.document import Document
import json

def load_dataset(path="data/businesses.json"):
    with open(path, "r") as f:
        data = json.load(f)
    return [
        Document(
            page_content=f"{b['name']}, {b['category']}, {b['location']}, {b['description']}",
            metadata=b
        )
        for b in data
    ]

def create_vector_store():
    model_name = "sentence-transformers/all-MiniLM-L6-v2"  # Fast and free
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    docs = load_dataset()
    return FAISS.from_documents(docs, embeddings)

vector_store = create_vector_store()
