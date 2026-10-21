# SPDX-License-Identifier: MIT
"""Optimization API endpoint for cooling setpoint recommendation."""

from fastapi import APIRouter
import numpy as np
import pandas as pd

from backend.schemas.optimization import (
    CandidatePointSchema,
    OptimizationRequest,
    OptimizationResponse,
)
from core.config import (
    CHILLED_WATER_MAX,
    CHILLED_WATER_MIN,
    ENERGY_MODEL_FEATURES,
)
from core.feature_engineering import (
    FeatureEngineeringError,
    build_energy_features,
)
from core.model_loader import ModelStore
from core.optimization import optimize_cooling
from core.schemas import SensorReading

router = APIRouter(prefix="/api", tags=["optimization"])


@router.post("/optimize", response_model=OptimizationResponse)
def post_optimize(request: OptimizationRequest) -> OptimizationResponse:
    """Find the optimal chilled-water setpoint adjustment using the canonical optimization core."""
    store = ModelStore.get()

    if request.pre_engineered_row:
        # Build 1-row DataFrame directly
        row = pd.Series(request.pre_engineered_row)
        missing = [c for c in ENERGY_MODEL_FEATURES if c not in row.index]
        if missing:
            raise FeatureEngineeringError(f"Missing required energy features: {missing}")
        energy_df = pd.DataFrame([row[ENERGY_MODEL_FEATURES].values], columns=ENERGY_MODEL_FEATURES)
        current_cwr = float(row["Chilled Water Rate (L/sec)"])
    elif request.reading and request.history:
        if len(request.history) < 12:
            raise FeatureEngineeringError(
                f"Need at least 12 rows of history for optimization feature engineering, got {len(request.history)}."
            )
        reading = SensorReading(
            timestamp=request.reading.timestamp,
            chilled_water_rate=request.reading.chilled_water_rate,
            cooling_water_temp=request.reading.cooling_water_temp,
            building_load=request.reading.building_load,
            outside_temp=request.reading.outside_temp,
            dew_point=request.reading.dew_point,
            humidity=request.reading.humidity,
            wind_speed=request.reading.wind_speed,
            pressure=request.reading.pressure,
            chiller_energy=request.reading.chiller_energy,
        )
        history_df = pd.DataFrame([h.model_dump(by_alias=True) for h in request.history])
        energy_df = build_energy_features(reading, history_df)
        current_cwr = float(reading.chilled_water_rate)
    else:
        raise ValueError("Must provide either 'pre_engineered_row' or 'reading' with 'history'.")

    # Run canonical optimization service
    core_result = optimize_cooling(
        energy_df,
        store=store,
        adjustments=request.adjustments,
        include_temp=request.include_temp,
        temperature_constraint_max=request.temperature_constraint_max,
    )

    # Transform candidate points to API schema
    candidates: list[CandidatePointSchema] = []
    selected_adj = 0.0
    selected_cwr = current_cwr

    for c in core_result.candidates:
        cand_cwr = float(np.clip(current_cwr + c.chilled_water_rate_adjustment, CHILLED_WATER_MIN, CHILLED_WATER_MAX))

        if c.is_selected:
            selected_adj = c.chilled_water_rate_adjustment
            selected_cwr = cand_cwr

        energy_delta = c.predicted_energy_kwh - core_result.baseline_energy_kwh

        candidates.append(
            CandidatePointSchema(
                chilled_water_rate_adjustment=c.chilled_water_rate_adjustment,
                chilled_water_rate=round(cand_cwr, 2),
                predicted_energy_kwh=round(c.predicted_energy_kwh, 4),
                predicted_temp_c=round(c.predicted_temp_c, 4) if c.predicted_temp_c is not None else None,
                energy_delta_kwh=round(energy_delta, 4),
                is_selected=c.is_selected,
                satisfies_temp_constraint=c.satisfies_constraint,
            )
        )

    return OptimizationResponse(
        baseline_energy_kwh=round(core_result.baseline_energy_kwh, 4),
        optimized_energy_kwh=round(core_result.optimized_energy_kwh, 4),
        estimated_energy_reduction_kwh=round(core_result.energy_savings_kwh, 4),
        savings_percent=round(core_result.savings_percent, 2),
        current_chilled_water_rate=round(current_cwr, 2),
        selected_chilled_water_rate=round(selected_cwr, 2),
        selected_adjustment=round(selected_adj, 2),
        baseline_temp_c=round(core_result.baseline_temp_c, 4) if core_result.baseline_temp_c is not None else None,
        suggestion=core_result.suggestion,
        candidates=candidates,
        evaluation_status=core_result.evaluation_status,
        temperature_constraint_max=core_result.temperature_constraint_max,
        feasible_candidate_found=core_result.feasible_candidate_found,
        units={"energy": "kWh", "flow_rate": "L/sec", "temperature": "°C"},
        disclaimer="Values represent counterfactual model-estimated energy differences, not physically measured real-world savings.",
    )
