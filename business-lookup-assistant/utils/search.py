from utils.embedding import vector_store
from langchain.chat_models import ChatOpenAI

def get_top_matches(query: str, k=3):
    return vector_store.similarity_search(query, k=k)

def generate_response(query: str, matches):
    llm = ChatOpenAI(temperature=0.7)
    business_list = "\n".join([f"- {m.metadata['name']}: {m.metadata['description']}" for m in matches])
    prompt = f"""You are a helpful assistant. A user asked: "{query}". Based on the dataset, here are the top matches:
{business_list}
Respond conversationally and offer to help further."""
    return llm.predict(prompt)