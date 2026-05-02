# CareMate

CareMate is a healthcare management platform for patients, doctors, caregivers, and admins. It combines a React dashboard, an Express/MongoDB API, and a Python FastAPI AI service for chatbot support, symptom analysis, and care routine recommendations.

## Features

- Role-based dashboards for patients, doctors, caregivers, and admins
- Authentication with JWT, local login, password reset, and optional Google sign-in
- Patient vitals tracking with charts and history
- Medication and reminder management
- Appointment and consultation workflows
- Caregiver workboard and patient care logs
- Notifications and email support
- AI-assisted chat, symptom analysis, and routine recommendations

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Nodemailer, node-cron
- AI service: Python, FastAPI, Pydantic, HTTPX, Ollama

## Project Structure

```text
caremate/
  frontend/      React + Vite client
  backend/       Express API and MongoDB models
  ai-service/    FastAPI AI microservice
```

## Prerequisites

- Node.js and npm
- Python 3.10 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- Ollama, if you want local AI chatbot responses

## Environment Setup

Create environment files from the examples:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item ai-service\.env.example ai-service\.env
```

Important local values:

```env
# backend/.env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/caremate
JWT_SECRET=replace-with-a-long-random-secret
AI_SERVICE_URL=http://localhost:8000/api
```

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_APP_NAME=CareMate
```

```env
# ai-service/.env
PORT=8000
HOST=0.0.0.0
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama:latest
```

The frontend example may contain a `3000` API URL. For this backend, use `http://localhost:5000/api/v1` unless you intentionally change the backend port.

## Installation

Install dependencies for each service:

```powershell
cd backend
npm install

cd ..\frontend
npm install

cd ..\ai-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Running Locally

Start MongoDB first, then run each service in a separate terminal.

Backend API:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

AI service:

```powershell
cd ai-service
.\venv\Scripts\python.exe main.py
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/v1/health`
- AI service health check: `http://localhost:8000/health`
- AI service docs: `http://localhost:8000/api/docs`

## Ollama Setup

Install and start Ollama, then pull the model configured in `ai-service/.env`:

```powershell
ollama pull tinyllama:latest
```

The AI service includes rule-based fallback responses for common healthcare topics, but full chatbot responses require Ollama to be running.

## Useful Scripts

Backend:

```powershell
npm run dev
npm start
```

Frontend:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

AI service:

```powershell
.\venv\Scripts\python.exe main.py
```

## API Overview

The backend exposes routes under `/api/v1`:

- `/auth` - register, login, Google login, password reset, current user, logout
- `/patients` - patient profile and patient data
- `/doctors` - doctor profile and doctor workflows
- `/caregivers` - caregiver profile and care work
- `/admin` - admin dashboards and management
- `/vitals` - vitals records
- `/medications` - medication records and reminders
- `/appointments` - appointment scheduling
- `/consultations` - consultation workflows
- `/notifications` - user notifications
- `/ai` - backend proxy to the FastAPI AI service

Most application routes require a valid JWT in the `Authorization: Bearer <token>` header.

## Notes

- Keep `.env` files out of git because they contain secrets.
- Set `ADMIN_SETUP_KEY` in `backend/.env` before creating an admin account.
- Configure email settings in `backend/.env` to enable welcome and password reset emails.
- Configure `GOOGLE_CLIENT_ID` in both backend and frontend env files to enable Google sign-in.
- The root `docker-compose.yml` is currently a placeholder and is not required for local development.

