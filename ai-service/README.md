# CareMate AI Service

This service is designed to run on modern Python versions, including Python 3.13.

## Recommended setup

```powershell
cd R:\caremate\ai-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
```

## If you already have an older broken venv

```powershell
cd R:\caremate\ai-service
Remove-Item -Recurse -Force .\venv
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
```

## Notes

- Start Ollama before testing chat responses.
- Make sure the `tinyllama:latest` model is installed in Ollama.
- The AI service now reads `OLLAMA_BASE_URL` and `OLLAMA_MODEL` from `.env`.
- The backend expects this service to run on `http://localhost:8000`.
- If `python` points to Python 3.13 on your machine, the updated dependencies should install without needing Visual Studio C++ build tools.
