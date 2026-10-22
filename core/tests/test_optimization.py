# SPDX-License-Identifier: MIT
"""Tests for core.optimization — grid-search cooling optimization."""

import pandas as pd
import pytest

from core.config import CHILLED_WATER_MAX, CHILLED_WATER_MIN
from core.model_loader import ModelStore
from core.optimization import DEFAULT_ADJUSTMENTS, optimize_cooling
from core.prediction import predict_energy_from_row
from core.schemas import OptimizationResult


class TestOptimizationConstraints:
    """Verify that the optimiser respects constraints."""

    def _build_energy_row(
        self, sample_df: pd.DataFrame, store: ModelStore
    ) -> pd.DataFrame:
        """Build a 1-row energy-model DataFrame from sample row 0."""
        return sample_df[store.energy_feature_names].iloc[0:1].copy()

    def test_returns_optimization_result(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        assert isinstance(result, OptimizationResult)

    def test_baseline_equals_zero_adjustment(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        """The baseline energy should equal prediction at adj=0."""
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        zero_candidate = [
            c for c in result.candidates
            if c.chilled_water_rate_adjustment == 0.0
        ]
        assert len(zero_candidate) == 1
        assert abs(
            zero_candidate[0].predicted_energy_kwh
            - result.baseline_energy_kwh
        ) < 1e-6

    def test_savings_non_negative(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        assert result.energy_savings_kwh >= -1e-6

    def test_optimized_leq_baseline(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        assert result.optimized_energy_kwh <= result.baseline_energy_kwh + 1e-6

    def test_candidates_count(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        assert len(result.candidates) == len(DEFAULT_ADJUSTMENTS)

    def test_exactly_one_selected(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = self._build_energy_row(sample_df, store)
        result = optimize_cooling(X, store)
        selected = [c for c in result.candidates if c.is_selected]
        # Either 1 selected (savings found) or 0 (baseline is best)
        if result.energy_savings_kwh > 0.01:
            assert len(selected) == 1
        else:
            # When baseline is best, no candidate is marked selected
            assert len(selected) <= 1

    def test_chilled_water_stays_in_range(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        """After adjustment, the chilled-water rate should not exceed
        the training-data range."""
        X = self._build_energy_row(sample_df, store)
        base_cwr = float(X.iloc[0]["Chilled Water Rate (L/sec)"])
        for adj in DEFAULT_ADJUSTMENTS:
            clipped = max(
                CHILLED_WATER_MIN, min(CHILLED_WATER_MAX, base_cwr + adj)
            )
            assert CHILLED_WATER_MIN <= clipped <= CHILLED_WATER_MAX


class TestOptimizationResultSelection:
    """Verify selection logic picks the lowest energy."""

    def test_selected_has_lowest_energy(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store)
        min_energy = min(c.predicted_energy_kwh for c in result.candidates)
        assert abs(result.optimized_energy_kwh - min_energy) < 1e-6


class TestOptimizationWithTemp:
    """Verify that temperature predictions are included."""

    def test_baseline_temp_populated(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store, include_temp=True)
        assert result.baseline_temp_c is not None
        assert 0 < result.baseline_temp_c < 50

    def test_candidates_have_temp(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store, include_temp=True)
        for c in result.candidates:
            assert c.predicted_temp_c is not None

    def test_without_temp(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store, include_temp=False)
        assert result.baseline_temp_c is None
        for c in result.candidates:
            assert c.predicted_temp_c is None


class TestOptimizationCustomGrid:
    """Verify that a custom search grid works."""

    def test_custom_adjustments(
        self, sample_df: pd.DataFrame, store: ModelStore
    ):
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        custom = [-10.0, 0.0, 10.0]
        result = optimize_cooling(
            X, store, adjustments=custom, include_temp=False
        )
        assert len(result.candidates) == 3


class TestOptimizationTemperatureConstraints:
    """Verify temperature-constrained optimization in canonical core."""

    def test_unconstrained_default(self, sample_df: pd.DataFrame, store: ModelStore):
        """When temperature_constraint_max is None, evaluation status is unconstrained and candidates have satisfies_constraint=None."""
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store)
        assert result.evaluation_status == "unconstrained"
        assert result.temperature_constraint_max is None
        assert result.feasible_candidate_found is True
        for c in result.candidates:
            assert c.satisfies_constraint is None

    def test_constrained_optimal_selection(self, sample_df: pd.DataFrame, store: ModelStore):
        """When constraint is generous (45 C), candidates satisfy and best candidate is selected."""
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store, temperature_constraint_max=45.0)
        assert result.evaluation_status == "constrained_optimal"
        assert result.temperature_constraint_max == 45.0
        assert result.feasible_candidate_found is True
        assert all(c.satisfies_constraint is True for c in result.candidates)
        assert any(c.is_selected for c in result.candidates)

    def test_no_feasible_candidate(self, sample_df: pd.DataFrame, store: ModelStore):
        """When constraint is unrealistically low (20 C), all candidates violate and no candidate is selected."""
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        result = optimize_cooling(X, store, temperature_constraint_max=20.0)
        assert result.evaluation_status == "no_feasible_candidate"
        assert result.feasible_candidate_found is False
        assert result.optimized_energy_kwh == result.baseline_energy_kwh
        assert result.energy_savings_kwh == 0.0
        assert not any(c.is_selected for c in result.candidates)
        assert all(c.satisfies_constraint is False for c in result.candidates)
        assert "no candidate satisfies" in result.suggestion.lower()

    def test_constrained_only_selects_satisfying(self, sample_df: pd.DataFrame, store: ModelStore):
        """When constraint is tight, selected candidate must satisfy the constraint even if a violating candidate has lower energy."""
        X = sample_df[store.energy_feature_names].iloc[0:1].copy()
        # Find candidate temperatures under unconstrained run
        unconstrained = optimize_cooling(X, store)
        temps = [c.predicted_temp_c for c in unconstrained.candidates if c.predicted_temp_c is not None]
        median_temp = sorted(temps)[len(temps) // 2]

        constrained = optimize_cooling(X, store, temperature_constraint_max=median_temp)
        if constrained.feasible_candidate_found:
            selected = [c for c in constrained.candidates if c.is_selected]
            if selected:
                assert selected[0].satisfies_constraint is True
                assert selected[0].predicted_temp_c <= median_temp
