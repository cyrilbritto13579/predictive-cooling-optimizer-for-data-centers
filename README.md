# Predictive Cooling Optimizer for Data Centers: Temperature-Aware Chiller Scheduling

English | [தமிழ்](docs/README_TA.md) | [中文](docs/README_ZH.md) | [हिन्दी](docs/README_HI.md) | [Bahasa Indonesia](docs/README_ID.md)

![GitHub top language](https://img.shields.io/github/languages/top/vk22006/predictive-cooling-optimizer-for-data-centers)
![GitHub language count](https://img.shields.io/github/languages/count/vk22006/predictive-cooling-optimizer-for-data-centers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![GitHub forks](https://img.shields.io/github/forks/vk22006/predictive-cooling-optimizer-for-data-centers)

This project addresses energy inefficiency in data center cooling facilities by developing a temperature-aware predictive model that optimizes chiller plant operations. By forecasting thermal dynamics in advance, the system minimizes electrical power consumption while maintaining stringent temperature safety boundaries. Traditional reactive cooling systems respond only after temperatures rise, resulting in unnecessary energy spikes and inefficient chiller operation.

![Home Page](docs/img/homePage.png "Home Page")

## Project Methodology

The pipeline begins with thorough data preprocessing across 13,615 HVAC telemetry records, including IQR-based outlier detection, MinMaxScaler normalization, and an 80-20 chronological train-test split to preserve temporal sequence integrity.

A total of 46 engineered features were developed, comprising 16 lag features, 12 rolling window statistics, 6 cyclical temporal encodings, and 4 interaction terms to capture complex thermodynamic interactions.

Two XGBoost regression models drive the core predictive engine:

* **Energy Forecasting Model**: $R^2 = 0.9891$, $\text{MAE} = 1.222\text{ kWh}$
* **Temperature Forecasting Model**: $R^2 = 0.6853$, with $89.24\%$ of predictions within a $\pm 1^\circ\text{C}$ tolerance band

Both models demonstrate high computational efficiency, training in 2.12 seconds and 1.87 seconds respectively, enabling real-time edge or server deployment.

The `PredictiveCoolingOptimizer` engine integrates both models, executing constraint-bounded temperature management and energy minimization strategies across candidate flow rates.

## Testing

A comprehensive suite of 11 validation tests across five core categories was executed:

| Test Type | Target Scope | Status |
| :---: | :---: | :---: |
| Unit Tests | Energy & Temperature models, Optimization engine | ✅ Passed |
| Integration Tests | End-to-end inference pipeline & API integration | ✅ Passed |
| Functional Tests | Accuracy thresholds, response latency & core logic | ✅ Passed |
| White Box Tests | Hyperparameters, feature schema alignment | ✅ Passed |
| Black Box Tests | Boundary conditions & prediction consistency | ✅ Passed |
| | **Passed Tests** | **11/11** |
| | **Failed Tests** | **0/11** |
| | **Pass Rate** | **100.0%** |

## Execution Steps

Getting started is simple. Follow the steps below to run the application locally:

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Start the FastAPI backend service (port 8000):

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

3. Launch the React frontend application (port 5173):

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Tools Used

1. **Anaconda Jupyter**: Initial exploratory analysis, model training, and scientific validation
2. **FastAPI & Uvicorn**: High-performance asynchronous Python REST API
3. **React 19, TypeScript & Vite**: Industrial dark-mode interactive web dashboard
4. **NumPy, Pandas & Scikit-Learn**: Telemetry preprocessing and feature transformation
5. **XGBoost**: Primary gradient boosting regression engine

## Algorithms Used

### 1. Predictive Algorithms
* **XGBoost (Extreme Gradient Boosting)**
* **Sequential Chained Regression** (coupling energy demand forecasting to forward temperature estimation)

### 2. Supporting Algorithms
* **Min-Max Normalization**
* **46-Dimensional Feature Engineering** (autoregressive lags, rolling aggregations, cyclical time representations, and thermodynamic interactions)

This platform demonstrates the feasibility and real-world viability of software-driven predictive cooling optimization. The trained models are fully operational and served through a modern React + FastAPI architecture.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

<a href="https://www.star-history.com/">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=vk22006/predictive-cooling-optimizer-for-data-centers&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=vk22006/predictive-cooling-optimizer-for-data-centers&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=vk22006/predictive-cooling-optimizer-for-data-centers&type=date&legend=top-left" />
 </picture>
</a>
