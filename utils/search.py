import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA

load_dotenv()

VECTOR_STORE_PATH = "faiss_index"

def get_vector_store():
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    return FAISS.load_local(
        VECTOR_STORE_PATH, 
        embeddings, 
        allow_dangerous_deserialization=True
    )

def get_top_matches(query: str, k: int = 3):
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(query, k=k)
        return [doc.metadata for doc in docs]
    except Exception as e:
        print(f"Error retrieving matches: {e}")
        return []

def generate_response(query: str, top_matches: list):
    try:
        # **Strategy: Prioritize Google Gemini**
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            print("GOOGLE_API_KEY not found. Falling back to Ollama.")
            raise ValueError("API key not set.")

        print("Attempting to use Google Gemini...")
        llm = ChatGoogleGenerativeAI(
            model="gemini-pro", 
            google_api_key=google_api_key
        )
        
        # This will test the API connection before proceeding.
        llm.invoke("Test connection.")
        
        vector_store = get_vector_store()
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
        )
        response = qa_chain.invoke({"query": query})
        return response['result']

    except Exception as e:
        print(f"Google Gemini failed ({e}). Falling back to Ollama...")
        try:
            # **Fallback to Ollama**
            llm = Ollama(model="llama3")

            vector_store = get_vector_store()
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})

            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
            )
            response = qa_chain.invoke({"query": query})
            return response['result']
        except Exception as e:
            print(f"Ollama also failed ({e}).")
            return "Sorry, I could not generate a response at this time."