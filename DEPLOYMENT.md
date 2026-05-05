# CareMate Deployment

This project is split into three services:

- `backend`: Render web service
- `frontend`: Vercel Vite app
- `ai-service`: local FastAPI service exposed to Render through a public tunnel

## 1. Rotate Your MongoDB Password

The MongoDB Atlas URI should never be shared in chat or committed to git. In Atlas, rotate the database user's password, then use the new URI only in environment variables.

Use this shape:

```env
mongodb+srv://<username>:<password>@caremate-cluster.efr5jpj.mongodb.net/caremate?retryWrites=true&w=majority
```

## 2. Run The AI Service Locally

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
```

Confirm it works:

```text
http://localhost:8000/health
```

Render cannot access your laptop's `localhost`. Keep the AI service local by exposing it with a tunnel:

```powershell
ngrok http 8000
```

Use the HTTPS forwarding URL from ngrok as:

```env
AI_SERVICE_URL=https://your-ngrok-url.ngrok-free.app/api
```

If the tunnel URL changes, update `AI_SERVICE_URL` in Render and redeploy/restart the backend.

## 3. Deploy Backend On Render

Render can use the root `render.yaml` blueprint. If creating manually:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/v1/health`

Set these Render environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@caremate-cluster.efr5jpj.mongodb.net/caremate?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRE=30d
CLIENT_URL=https://caremate001.vercel.app
ALLOW_VERCEL_PREVIEWS=true
AI_SERVICE_URL=https://your-ngrok-url.ngrok-free.app/api
AI_SERVICE_TIMEOUT=30000
ENABLE_AI_FEATURES=true
ENABLE_EMAIL_NOTIFICATIONS=false
SCHEDULER_ENABLED=true
```

After deploy, test:

```text
https://caremate-hx61.onrender.com/api/v1/health
```

## 4. Deploy Frontend On Vercel

Set the Vercel project root directory to `frontend`.

Build settings:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Set these Vercel environment variables:

```env
VITE_API_BASE_URL=https://caremate-hx61.onrender.com/api/v1
VITE_APP_NAME=CareMate
VITE_GOOGLE_CLIENT_ID=<optional-google-client-id>
VITE_RECAPTCHA_SITE_KEY=<optional-recaptcha-site-key>
```

Redeploy the frontend after changing any `VITE_` variable.

## 5. Atlas Network Access

In MongoDB Atlas, allow Render to connect. For a quick student/free-tier setup, add this IP access list entry:

```text
0.0.0.0/0
```

For a stricter setup, use Render's documented outbound IPs if available for your service/plan.

## 6. Final URL Wiring

After Vercel gives you the final frontend URL, update Render:

```env
CLIENT_URL=https://caremate001.vercel.app
```

After ngrok gives you the tunnel URL, update Render:

```env
AI_SERVICE_URL=https://your-ngrok-url.ngrok-free.app/api
```

Then restart/redeploy the Render backend.
