from utils.embedding import vector_store
from langchain.chat_models import ChatOpenAI

def get_top_matches(query: str, k=3):
    return vector_store.similarity_search(query, k=k)

# def generate_response(query: str, matches):
#     llm = ChatOpenAI(temperature=0.7)
#     business_list = "\n".join([f"- {m.metadata['name']}: {m.metadata['description']}" for m in matches])
#     prompt = f"""You are a helpful assistant. A user asked: "{query}". Based on the dataset, here are the top matches:
# {business_list}
# Respond conversationally and offer to help further."""
#     return llm.predict(prompt)

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
import os

def generate_response(query, matches):
    api_key = os.getenv("GOOGLE_API_KEY")
    model = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=api_key)
    prompt = f"User asked: {query}\nTop matches:\n" + "\n".join([m.page_content for m in matches])
    response = model.invoke([HumanMessage(content=prompt)])
    return response.content
