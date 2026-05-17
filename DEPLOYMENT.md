# Deployment Guide

This project can be deployed quickly with:

- `Frontend`: Netlify
- `Backend`: Render
- `Database`: Render Postgres or Neon
- `Source control`: GitHub

For the presentation, prioritize a working hosted demo over perfect infrastructure.

## 1. Prepare the GitHub Repository

If this folder is not yet connected to your GitHub repo, run these commands from the project root:

```powershell
git init
git branch -M main
git add .
git commit -m "Initial helpdesk MVP"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Replace `YOUR-USERNAME/YOUR-REPO` with your actual GitHub repository path.

If the remote already exists, use:

```powershell
git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 2. Database Recommendation

Fastest option for tomorrow:

- use `Render Postgres` if you want everything together quickly
- use `Neon` if Render Postgres setup becomes annoying

You need a PostgreSQL connection string for the backend.

Example format:

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

## 3. Deploy Backend on Render

Create a new **Web Service** on Render from your GitHub repo.

Use these settings:

- `Root Directory`: `backend`
- `Environment`: `Docker`

Render will detect the Dockerfile in `backend/`.

### Backend Environment Variables

Set these in Render:

- `APP_ENV=production`
- `SECRET_KEY=choose-a-long-random-secret`
- `DATABASE_URL=your-postgres-connection-string`
- `CORS_ORIGINS=https://your-netlify-site.netlify.app`
- `UPLOADS_DIR=/tmp/uploads`
- `MAX_ATTACHMENT_SIZE_MB=10`

### Important Note About Attachments

Current hosted attachments use local filesystem storage.

That means:
- it is fine for the MVP
- it is **not persistent** on many cloud platforms
- for the presentation, do not rely heavily on attachments in the hosted demo unless you test them

If needed, present attachments as working in the MVP and explain that the production cloud version should use dedicated object storage.

## 4. Deploy Frontend on Netlify

Create a new site from GitHub on Netlify.

Use these settings:

- `Base directory`: `frontend`
- `Build command`: `npm run build`
- `Publish directory`: `dist`

### Frontend Environment Variable

Set:

- `VITE_API_BASE_URL=https://your-render-backend-url/api/v1`

Then trigger the deploy.

### Netlify SPA Routing

This project uses React Router, so Netlify must serve `index.html` for direct route refreshes.

That is handled by:

- [frontend/public/_redirects](C:/Users/Lenovo/Desktop/ISMAGI/S2/EFMs/cloud-computing/frontend/public/_redirects)

with:

```text
/* /index.html 200
```

## 5. Hosted Smoke Test

After both deployments finish, test:

1. sign in
2. create ticket
3. open ticket details
4. add comment
5. update status and priority as admin or agent

Only test attachments in the hosted version if there is time. They are less important than the main ticket workflow.

## 6. Local Fallback for Presentation

Keep the local Docker version ready as a backup:

```powershell
docker compose up --build -d
```

If the hosted demo has issues, you can still present the local working MVP.

## 7. What to Say in the Presentation

Suggested wording:

> We built a mini helpdesk platform using an open-source stack: React, FastAPI, and PostgreSQL.  
> The solution follows a cloud PaaS architecture and includes user authentication, ticket management, comments, attachments, and role-based administration.  
> The application is version-controlled with GitHub and deployed as a cloud-hosted web solution.
