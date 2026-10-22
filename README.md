# Predictive Cooling Optimizer for Data Centers: Temperature-Aware Chiller Scheduling

English | [தமிழ்](docs/README_TA.md) | [中文](docs/README_ZH.md) | [हिन्दी](docs/README_HI.md) | [Bahasa Indonesia](docs/README_ID.md)

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/predictive-cooling-optimizer-for-data-centers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Build: Passed](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Python Tests: 146 Passed](https://img.shields.io/badge/Python%20Tests-146%20Passed-brightgreen.svg)
![Frontend Tests: 16 Passed](https://img.shields.io/badge/Frontend%20Tests-16%20Passed-brightgreen.svg)

Predictive Cooling Optimizer is a software-based machine learning analytics platform designed to model chiller electrical consumption and forecast condenser cooling-water thermal trajectories in data center HVAC facilities. The system pairs a high-performance **FastAPI** computational service with an industrial dark-themed **React + TypeScript + Vite** user interface.

![home page](docs/img/homePage.png)

---

## 1. Architectural Overview

```text
┌────────────────────────────────────────────────────────┐
│              React 19 + TypeScript + Vite              │
│       Glassmorphic Industrial UI / Tailwind CSS        │
│  [/] [/dashboard] [/prediction] [/optimization] [/models]
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (HTTP)
┌───────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                     │
│    CORS Middleware • Pydantic v2 • Lifecycle Loader    │
│  POST /api/predict/* • POST /api/optimize • /simulation│
└───────────────────────────┬────────────────────────────┘
                            │ In-Memory Python Calls
┌───────────────────────────▼────────────────────────────┐
│               Canonical Core (core/)                   │
│   • Feature Engineering (46-feature lag/rolling/cyclic)│
│   • ModelStore Thread-Safe Singleton                   │
│   • Sequential Inference Pipeline                      │
│   • Temperature-Constrained Grid Search Optimizer      │
└───────────────────────────┬────────────────────────────┘
                            │ Model Artifacts
┌───────────────────────────▼────────────────────────────┐
│                     models/ (.pkl)                     │
│   • energy_model.pkl (XGBRegressor: R² = 0.9891)       │
│   • temp_model.pkl   (XGBRegressor: R² = 0.6853)       │
│   • feature_list.pkl (Feature alignment schema)        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack & Prerequisites

- **Python Runtime:** Python `3.10`, `3.11`, or `3.12`
- **Node.js Runtime:** Node.js `18.x` or higher (tested with `20.x` and `24.x`)
- **Backend Stack:** FastAPI, Uvicorn, Pydantic v2, Pandas, NumPy, XGBoost, Scikit-learn
- **Frontend Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React

---

## 3. Local Installation & Development

### Step 1: Clone the Repository
```bash
git clone https://github.com/vk22006/predictive-cooling-optimizer-for-data-centers.git
cd predictive-cooling-optimizer-for-data-centers
```

### Step 2: Set Up Python Backend
```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### Step 3: Set Up React Frontend
```bash
cd frontend
npm install
cd ..
```

### Step 4: Run the Development Servers
In your first terminal (FastAPI Backend on port `8000`):
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

In your second terminal (React Frontend on port `5173`):
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:5173`. The backend interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

---

## 4. Environment Variables

### Backend Configuration (`backend/.env` or system env)
Refer to [`backend/.env.example`](backend/.env.example):
| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for the Uvicorn ASGI server. |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of permitted frontend origins. |
| `ENVIRONMENT` | `development` | Deployment environment (`development` or `production`). |

### Frontend Configuration (`frontend/.env` or system env)
Refer to [`frontend/.env.example`](frontend/.env.example):
| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL pointing to the deployed FastAPI backend. |

---

## 5. API Endpoints Reference

The FastAPI service exposes the following typed REST endpoints:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check reporting service status, core availability, and preloaded models. |
| `/api/models/info` | `GET` | Metadata, hyperparameters, and feature schemas of XGBoost models. |
| `/api/predict/energy` | `POST` | Primary model forecast for chiller electrical power demand (kWh). |
| `/api/predict/temperature` | `POST` | Chained forward forecast for condenser cooling-water temperature (°C). |
| `/api/predict/combined` | `POST` | Sequential chained execution returning energy and temperature in one call. |
| `/api/optimize` | `POST` | Counterfactual grid search evaluating flow-rate adjustments and temperature constraints. |
| `/api/simulation/step` | `POST` | Deterministic, stateless single-step replay driver for live telemetry streaming. |
| `/api/data/sample` | `GET` | Paginated inspection of pre-engineered simulation dataset rows. |

Interactive Swagger documentation is served at `/docs`, with raw JSON schema at `/openapi.json`.

---

## 6. Production Deployment Architecture

To ensure operational stability and clean separation of concerns, the frontend and backend are decoupled for independent hosting:

```text
┌─────────────────────────────────┐        ┌───────────────────────────────────┐
│     Vercel / Static CDN         │        │    Container PaaS / VM / Cloud    │
│  (Frontend React + Vite SPA)    │  HTTP  │   (Render, Railway, Fly.io, AWS)  │
│                                 ├───────►│      FastAPI Uvicorn Backend      │
│  • Single-page app routing      │  REST  │  • Multi-stage Dockerfile         │
│  • Configured via vercel.json   │        │  • Preloads models on boot        │
│  • Reads VITE_API_BASE_URL      │        │  • CORS origins locked to frontend│
└─────────────────────────────────┘        └───────────────────────────────────┘
```

### Deploying the Frontend (e.g., Vercel)
1. Import the repository into Vercel and set the **Root Directory** to `frontend`.
2. Set the environment variable:
   ```text
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   ```
3. SPA deep routing is configured via [`frontend/vercel.json`](frontend/vercel.json), preventing 404s when navigating directly to `/dashboard`, `/prediction`, `/optimization`, or `/models`.

### Deploying the Backend (e.g., Docker / Render / Fly.io / AWS ECS)
A production [`Dockerfile`](Dockerfile) is provided in the root directory:
```bash
# Build container image
docker build -t predictive-cooling-backend .

# Run container
docker run -p 8000:8000 -e CORS_ORIGINS="https://your-frontend.vercel.app" predictive-cooling-backend
```
The container performs an automated health check against `http://localhost:8000/api/health` and launches Uvicorn using the configured `PORT`.

---

## 7. Model Performance Benchmarks

The predictive core uses two trained XGBoost regressors validated against a held-out chronological test split:

| Metric | Energy Model (`energy_model.pkl`) | Temperature Model (`temp_model.pkl`) |
| :--- | :--- | :--- |
| **Target Variable** | Chiller Energy Consumption (`kWh`) | Cooling Water Temperature (`°C`, +60 min ahead) |
| **Model Architecture** | `XGBRegressor` | `XGBRegressor` |
| **Input Features** | 46 engineered features | 46 engineered features |
| **Coefficient of Determination ($R^2$)** | **0.9891** | **0.6853** |
| **Mean Absolute Error (MAE)** | **1.222 kWh** | — |
| **Tolerance Accuracy** | — | **89.24%** within $\pm 1.0^\circ\text{C}$ |
| **Inference Time** | < 5 ms | < 5 ms |

---

## 8. Data Provenance & Scientific Integrity

### Dataset Provenance
- **Original Training Set:** The original XGBoost models were trained on 13,615 chronological HVAC sensor readings spanning environmental and mechanical features.
- **Replay Sequence ([`data/sample_test_data.csv`](data/sample_test_data.csv)):** A 100-row pre-engineered test sequence used exclusively for dashboard playback demonstration. It is **not** the complete training dataset.
- **Baseline Feature History ([`CANONICAL_BASELINE_HISTORY`](frontend/src/pages/Prediction.tsx)):** A fixed, validated 13-row reference operational benchmark used by the `/prediction` page to satisfy the 12-lag sliding-window requirement of the canonical feature pipeline. It is **not** live building telemetry.

### Operational Disclaimers
1. **Counterfactual Estimates:** All energy deltas and reduction percentages presented on the Optimization and Dashboard pages represent model-estimated counterfactual differences based on historical relationships, **not** physically measured or guaranteed real-world savings.
2. **No Physical Control:** This prototype application is purely an advisory, analytical simulation tool. It does **not** communicate with or control real physical programmable logic controllers (PLCs), building management systems (BMS), or SCADA hardware.
3. **Training Boundaries & Extrapolation:** Operating parameters beyond empirical training bounds (e.g. chilled water flow $< 72.4$ or $> 141.5\text{ L/sec}$; cooling water temp $< 25.8$ or $> 36.2^\circ\text{C}$) result in mathematical model extrapolation and are visually flagged in the interface.

---

## 9. Automated Testing & Verification Suite

The repository includes a regression and contract test suite covering Python and TypeScript layers:

```bash
# 1. Run Core and Backend Python Tests (146 tests)
python -m pytest core/tests/ backend/tests/ -q

# 2. Run Frontend Contract & Integrity Tests (16 tests)
cd frontend
npm test -- --run

# 3. Validate Frontend Production Build
npm run build
```

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
