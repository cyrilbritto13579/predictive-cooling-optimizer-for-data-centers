# Predictive Cooling Optimizer — Frontend

A high-performance React 19 + TypeScript + Vite web application for data center predictive cooling optimization and chiller plant monitoring.

## Features

- **Industrial Dark Theme:** Built with Tailwind CSS and glassmorphism styling designed for mission-critical operations.
- **Deterministic Live Simulation Dashboard (`/dashboard`):** Real-time synchronized time-series charts, key performance indicators, temperature safety bands, and counterfactual energy savings compared against historical operational baselines.
- **Manual Prediction Console (`/prediction`):** 10-parameter raw telemetry input form with pre-configured scenario presets, client-side validation, out-of-training-support boundary warnings, and sequential dual-model inference.
- **Interactive Optimization Explorer (`/optimization`):** Evaluates candidate flow rate setpoints across customizable maximum return water temperature constraints with tradeoff visualizations and candidate rankings.
- **Model Introspection (`/models`):** Inspects preloaded XGBoost model artifacts, hyperparameters, feature engineering schemas, and regression performance metrics.

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### Testing & Verification
```bash
# Run unit and contract tests
npm test -- --run

# Validate production build and TypeScript types
npm run build
```

## Architecture

- **Framework:** React 19, Vite, TypeScript
- **Styling & Components:** Tailwind CSS, Lucide React icons
- **Data Visualization:** Canvas/SVG time-series & scatter-line charts
- **API Client:** Typed REST client communicating with the FastAPI backend
