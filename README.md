# Mmondo Adventures

Mmondo Adventures is a tour-booking platform that connects East African operators with travellers. Customers browse and book Ugandan safaris, operators manage their listings, and superadmins oversee the marketplace.

The app is a **React** frontend with **FastAPI** as the JSON API. The UI is built with **Tailwind CSS** and **Bootstrap 5**.

---

## Brand colors

Use only primary `#ff7900`, secondary `#9f4200`, black, and white. Never use default blue for links, buttons, focus rings, or hover/active states.

| Token | Hex | Tailwind | Use |
| --- | --- | --- | --- |
| Primary | `#ff7900` | `primary` | Links, icons, filled buttons, focus rings |
| Secondary | `#9f4200` | `brand-secondary` / `primary-container` | Hover, active, and darker accents |
| Soft primary | `#ffe0c2` | `primary-fixed` | Light highlights and selected chips |
| Charcoal / black | `#1E1E1E` | `charcoal` | Headings, dark surfaces, pressed buttons |
| White | `#ffffff` | `white` / `surface-container-lowest` | Page backgrounds, cards, text on primary |

CSS variables in `frontend/src/index.css`: `--brand-primary`, `--brand-secondary`, `--brand-black`, `--brand-white`.

---

## Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite, React Router |
| Styling | Tailwind CSS, Bootstrap 5 |
| Backend | Python, FastAPI |
| Database | SQLite for local development, MySQL in Docker |
| Payments | Stripe, PayPal |
| Deploy | Docker, Docker Compose, GitHub Actions |

---

## Project layout

```
Prototype/
├── backend/                 FastAPI JSON API
│   ├── app/                 Routes, models, schemas
│   ├── alembic/             Database migrations
│   └── requirements.txt
├── frontend/                React + Vite app
│   ├── src/                 Pages and components
│   └── static/              Images and uploads
├── Dockerfile
├── docker-compose.yaml
├── run.py
└── run.bat
```

Public files live in `frontend/static` and are served at `/static/...`. Vite serves them in development. FastAPI writes tour and profile uploads into `frontend/static/uploads`.

---

## Run locally

You need **Python 3.10+**, **Node.js 18+**, and npm.

### One command

From the repo root:

```bash
python run.py
```

On Windows you can also use `run.bat`.

This creates `venv` if needed, installs Python packages, starts FastAPI at http://localhost:8000, and starts the React app at **http://localhost:5173**.

Open **http://localhost:5173**. Vite proxies `/api` and `/auth` to FastAPI.

### Two terminals

Backend:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --reload --host localhost --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

API docs: http://localhost:8000/docs

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `george.mutale345@stud.th-deg.de` | `Administer01@#` |
| Operator | `mutalegeorge367@gmail.com` | `Operator02@#` |
| Customer | `george.mutale@stud.th-deg.de` | `Tourist01@#` |

Operator portal: `/operator`  

First superadmin setup: `/superadmin/create`

---

## API

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Login, signup, profile |
| `/api/tours` | Public tour catalogue |
| `/api/bookings` | Booking flow |
| `/api/payment` | Stripe / PayPal checkout |
| `/api/operator` | Operator dashboard (tour posters) |
| `/api/superadmin` | Platform admin |

---

## Docker

```bash
docker compose up --build
```

The image builds the React app and FastAPI serves the compiled frontend from `/`.
