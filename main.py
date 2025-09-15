from fastapi import FastAPI, Request
from pydantic import BaseModel
from utils.search import get_top_matches, generate_response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["http://127.0.0.1:8000"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    user_input: str

@app.post("/lookup")
async def lookup_business(query: Query):
    """API endpoint to look up businesses and get an LLM-generated response."""
    user_input = query.user_input
    top_matches = get_top_matches(user_input)
    response = generate_response(user_input, top_matches)
    
    return {"results": top_matches, "message": response}