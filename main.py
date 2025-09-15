from fastapi import FastAPI
from pydantic import BaseModel
from utils.search import get_top_matches, generate_response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    user_input: str

@app.post("/lookup")
async def lookup_business(query: Query):
    top_matches = get_top_matches(query.user_input)
    response = generate_response(query.user_input, top_matches)
    return {"results": top_matches, "message": response}