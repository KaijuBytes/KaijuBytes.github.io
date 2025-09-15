# Business Lookup Assistant

This is a simple LLM-powered assistant built with FastAPI and LangChain. It takes a user query, retrieves relevant business information from a mock dataset using semantic search, and generates a natural language response.

## Requirements

- Python 3.9+
- A Google AI Studio API Key

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-link>
    cd <your-repo-name>
    ```

2.  **Create a Python virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create a `.env` file:**
    Create a file named `.env` in the root directory and add your Google AI Studio API key.

    ```
    GOOGLE_API_KEY=your_google_ai_studio_api_key
    ```

## Running the Application

1.  **Create the vector store:**
    Run the `embedding.py` script once to generate and save the vector embeddings.
    ```bash
    python embedding.py
    ```
    This will create a new directory named `faiss_index`.

2.  **Start the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

3.  **Use the assistant:**
    Open `index.html` in your web browser and use the search bar to interact with the assistant.
