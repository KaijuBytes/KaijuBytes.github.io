# import os
# from dotenv import load_dotenv
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_community.vectorstores import FAISS
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_community.llms import Ollama
# from langchain.chains import RetrievalQA

# load_dotenv()

# VECTOR_STORE_PATH = "faiss_index"

# def get_vector_store():
#     model_name = "sentence-transformers/all-MiniLM-L6-v2"
#     embeddings = HuggingFaceEmbeddings(model_name=model_name)
#     return FAISS.load_local(
#         VECTOR_STORE_PATH, 
#         embeddings, 
#         allow_dangerous_deserialization=True
#     )

# def get_top_matches(query: str, k: int = 3):
#     try:
#         vector_store = get_vector_store()
#         docs = vector_store.similarity_search(query, k=k)
#         return [doc.metadata for doc in docs]
#     except Exception as e:
#         print(f"Error retrieving matches: {e}")
#         return []

# def generate_response(query: str, top_matches: list):
#     try:
#         # **Strategy: Prioritize Google Gemini**
#         google_api_key = os.getenv("GOOGLE_API_KEY")
#         if not google_api_key:
#             print("GOOGLE_API_KEY not found. Falling back to Ollama.")
#             raise ValueError("API key not set.")

#         print("Attempting to use Google Gemini...")
#         llm = ChatGoogleGenerativeAI(
#             model="gemini-pro", 
#             google_api_key=google_api_key
#         )
        
#         # This will test the API connection before proceeding.
#         llm.invoke("Test connection.")
        
#         vector_store = get_vector_store()
#         retriever = vector_store.as_retriever(search_kwargs={"k": 3})
#         qa_chain = RetrievalQA.from_chain_type(
#             llm=llm,
#             chain_type="stuff",
#             retriever=retriever,
#         )
#         response = qa_chain.invoke({"query": query})
#         return response['result']

#     except Exception as e:
#         print(f"Google Gemini failed ({e}). Falling back to Ollama...")
#         try:
#             # **Fallback to Ollama**
#             llm = Ollama(model="llama3")

#             vector_store = get_vector_store()
#             retriever = vector_store.as_retriever(search_kwargs={"k": 3})

#             qa_chain = RetrievalQA.from_chain_type(
#                 llm=llm,
#                 chain_type="stuff",
#                 retriever=retriever,
#             )
#             response = qa_chain.invoke({"query": query})
#             return response['result']
#         except Exception as e:
#             print(f"Ollama also failed ({e}).")
#             return "Sorry, I could not generate a response at this time."

import os
from langchain_community.llms import Ollama
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# This is a new file that was missing from your project structure

# Initialize the Ollama model
llm = Ollama(model="llama3")

# Initialize the embeddings and vector store
VECTOR_STORE_PATH = "faiss_index"
model_name = "sentence-transformers/all-MiniLM-L6-v2"
embeddings = HuggingFaceEmbeddings(model_name=model_name)

# Ensure the vector store is loaded before the app starts
try:
    vector_store = FAISS.load_local(
        VECTOR_STORE_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )
except RuntimeError as e:
    print(f"Error loading vector store: {e}")
    print("Please run `python embedding.py` to create the vector store first.")
    vector_store = None

def get_top_matches(query: str):
    """Retrieves the top 3 most relevant business documents from the vector store."""
    if not vector_store:
        return []
    return vector_store.similarity_search(query, k=3)

def generate_response(query: str, top_matches):
    """Generates a response using the LLM based on the user's query and top business matches."""
    if not top_matches:
        return "Sorry, no businesses match your query."

    context = "\n\n".join([
        f"Name: {match.metadata['name']}\nCategory: {match.metadata['category']}\nLocation: {match.metadata['location']}\nDescription: {match.metadata['description']}\nStars: {match.metadata['stars']}"
        for match in top_matches
    ])

    prompt = f"""
    You are a business lookup assistant. Based on the user's query and the provided context, provide a helpful and friendly response. If there are relevant businesses, list them. If no businesses are relevant, state that no matches were found.

    User query: {query}

    Context (Top 3 relevant businesses):
    {context}

    Response:
    """
    
    try:
        response = llm.invoke(prompt)
        return response
    except Exception as e:
        print(f"Error generating response from LLM: {e}")
        return "Sorry, I could not generate a response at this time."