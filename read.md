# Business Lookup Assistant

A simple LLM-powered assistant for looking up businesses.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
    cd your-repository-name
    ```

2.  **Set Up Your Environment:**
    * **Create a `.env` file:** Copy the `.env.example` file (you will need to create this) and add your `GOOGLE_API_KEY` to it.
    * **Install Ollama:** If using a local LLM, download and install Ollama, then pull the required model (e.g., `ollama pull llama3`).

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Generate Embeddings:**
    ```bash
    python embedding.py
    ```

5.  **Run the App:**
    * **Start the Ollama Server** in a separate terminal:
        ```bash
        ollama serve
        ```
    * **Start the FastAPI Server:**
        ```bash
        uvicorn main:app --reload
        ```

6.  **Use the Application:**
    Open `index.html` in your web browser and you can start searching!