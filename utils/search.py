import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA

load_dotenv()

VECTOR_STORE_PATH = "faiss_index"

def get_vector_store():
    """Loads the vector store from disk."""
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=model_name)

    # Use `allow_dangerous_deserialization=True` to load from disk
    return FAISS.load_local(
        VECTOR_STORE_PATH, 
        embeddings, 
        allow_dangerous_deserialization=True
    )

def get_top_matches(query: str, k: int = 3):
    """Retrieves the top k most relevant documents from the vector store."""
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(query, k=k)
        return [doc.metadata for doc in docs]
    except Exception as e:
        print(f"Error retrieving matches: {e}")
        return []

def generate_response(query: str, top_matches: list):
    """Generates a natural language response using an LLM based on retrieved documents."""
    try:
        vector_store = get_vector_store()
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})

        llm = ChatGoogleGenerativeAI(
            model="gemini-pro", 
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
        )
        
        response = qa_chain.invoke({"query": query})
        
        return response['result']
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Sorry, I could not generate a response at this time."