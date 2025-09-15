from fastapi import FastAPI, Request
from pydantic import BaseModel
from utils.search import get_top_matches, generate_response

app = FastAPI()

class Query(BaseModel):
    user_input: str

@app.post("/lookup")
async def lookup_business(query: Query):
    top_matches = get_top_matches(query.user_input)
    response = generate_response(query.user_input, top_matches)
    return {"results": top_matches, "message": response}


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify: ["https://kaijubytes.github.io"]
    allow_methods=["*"],
    allow_headers=["*"],
)