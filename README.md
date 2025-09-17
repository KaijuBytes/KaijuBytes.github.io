Business Lookup Assistant
A simple LLM-powered assistant for looking up businesses.

Setup Instructions
Clone the Repository:

git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
cd your-repository-name
Set Up Your Environment:

Create a .env file: Copy the .env.example file (you will need to create this) and add your GOOGLE_API_KEY to it.
Install Ollama: If using a local LLM, download and install Ollama, then pull the required model (e.g., ollama pull llama3).
Install Dependencies:

pip install -r requirements.txt
Generate Embeddings:

python embedding.py
Run the App:

Start the Ollama Server in a separate terminal:
ollama serve
Start the FastAPI Server:
uvicorn main:app --reload
Use the Application: Open index.html in your web browser and you can start searching!
