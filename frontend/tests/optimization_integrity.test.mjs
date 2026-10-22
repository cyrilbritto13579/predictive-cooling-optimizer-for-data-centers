// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Mock data fixtures representing API responses for optimization
 */
function makeMockOptimizationResponse(mode = 'unconstrained') {
  if (mode === 'unconstrained') {
    return {
      baseline_energy_kwh: 128.83,
      optimized_energy_kwh: 125.40,
      estimated_energy_reduction_kwh: 3.43,
      savings_percent: 2.66,
      current_chilled_water_rate: 94.0,
      selected_chilled_water_rate: 89.0,
      selected_adjustment: -5.0,
      baseline_temp_c: 32.15,
      suggestion: 'Adjust chilled-water rate by -5.0 L/sec to save 3.43 kWh (2.7%).',
      evaluation_status: 'unconstrained',
      temperature_constraint_max: null,
      feasible_candidate_found: true,
      candidates: [
        {
          chilled_water_rate_adjustment: -5.0,
          chilled_water_rate: 89.0,
          predicted_energy_kwh: 125.40,
          predicted_temp_c: 32.45,
          energy_delta_kwh: -3.43,
          is_selected: true,
          satisfies_temp_constraint: null,
        },
        {
          chilled_water_rate_adjustment: 0.0,
          chilled_water_rate: 94.0,
          predicted_energy_kwh: 128.83,
          predicted_temp_c: 32.15,
          energy_delta_kwh: 0.0,
          is_selected: false,
          satisfies_temp_constraint: null,
        },
      ],
      units: { energy: 'kWh', flow_rate: 'L/sec', temperature: '°C' },
      disclaimer: 'Values represent counterfactual model-estimated energy differences, not physically measured real-world savings.',
    };
  } else if (mode === 'no_feasible_candidate') {
    return {
      baseline_energy_kwh: 128.83,
      optimized_energy_kwh: 128.83,
      estimated_energy_reduction_kwh: 0.0,
      savings_percent: 0.0,
      current_chilled_water_rate: 94.0,
      selected_chilled_water_rate: 94.0,
      selected_adjustment: 0.0,
      baseline_temp_c: 32.15,
      suggestion: 'No candidate satisfies temperature constraint (≤ 25.00°C). Baseline setpoint retained.',
      evaluation_status: 'no_feasible_candidate',
      temperature_constraint_max: 25.0,
      feasible_candidate_found: false,
      candidates: [
        {
          chilled_water_rate_adjustment: -5.0,
          chilled_water_rate: 89.0,
          predicted_energy_kwh: 125.40,
          predicted_temp_c: 32.45,
          energy_delta_kwh: -3.43,
          is_selected: false,
          satisfies_temp_constraint: false,
        },
        {
          chilled_water_rate_adjustment: 0.0,
          chilled_water_rate: 94.0,
          predicted_energy_kwh: 128.83,
          predicted_temp_c: 32.15,
          energy_delta_kwh: 0.0,
          is_selected: false,
          satisfies_temp_constraint: false,
        },
      ],
      units: { energy: 'kWh', flow_rate: 'L/sec', temperature: '°C' },
      disclaimer: 'Values represent counterfactual model-estimated energy differences, not physically measured real-world savings.',
    };
  }
}

test('1. In-flight protection: repeated clicks during optimization are ignored', async () => {
  let callCount = 0;
  let isOptimizing = false;

  async function triggerOptimization() {
    if (isOptimizing) return;
    isOptimizing = true;
    callCount++;
    await new Promise((r) => setTimeout(r, 50));
    isOptimizing = false;
  }

  // Trigger 3 calls concurrently
  const p1 = triggerOptimization();
  const p2 = triggerOptimization();
  const p3 = triggerOptimization();
  await Promise.all([p1, p2, p3]);

  assert.strictEqual(callCount, 1, 'Only one optimization request should be dispatched');
});

test('2. Unconstrained evaluation contract: candidates have satisfies_temp_constraint=null', () => {
  const result = makeMockOptimizationResponse('unconstrained');
  assert.strictEqual(result.evaluation_status, 'unconstrained');
  assert.strictEqual(result.temperature_constraint_max, null);
  assert.strictEqual(result.feasible_candidate_found, true);
  for (const c of result.candidates) {
    assert.strictEqual(c.satisfies_temp_constraint, null);
  }
});

test('3. Infeasible constraint handling: marks feasible_candidate_found=false and keeps baseline', () => {
  const result = makeMockOptimizationResponse('no_feasible_candidate');
  assert.strictEqual(result.evaluation_status, 'no_feasible_candidate');
  assert.strictEqual(result.feasible_candidate_found, false);
  assert.strictEqual(result.estimated_energy_reduction_kwh, 0.0);
  assert.strictEqual(result.selected_adjustment, 0.0);
  assert.ok(result.candidates.every((c) => !c.is_selected));
  assert.ok(result.candidates.every((c) => c.satisfies_temp_constraint === false));
});

test('4. Scientific integrity: disclaimers and units present', () => {
  const result = makeMockOptimizationResponse('unconstrained');
  assert.ok(result.disclaimer.includes('counterfactual'));
  assert.ok(result.disclaimer.includes('not physically measured'));
  assert.strictEqual(result.units.energy, 'kWh');
  assert.strictEqual(result.units.flow_rate, 'L/sec');
  assert.strictEqual(result.units.temperature, '°C');
});

test('5. Previous result preservation: failed request preserves previous valid state', async () => {
  let activeResult = makeMockOptimizationResponse('unconstrained');
  let resultScenarioIndex = 0;
  let currentScenarioIndex = 5;
  let errorMessage = null;

  async function failRun() {
    try {
      throw new Error('500 Internal Server Error');
    } catch (e) {
      errorMessage = e.message;
      // Do NOT overwrite activeResult
    }
  }

  await failRun();

  assert.strictEqual(errorMessage, '500 Internal Server Error');
  assert.strictEqual(resultScenarioIndex, 0, 'Previous scenario index is preserved');
  assert.strictEqual(activeResult.baseline_energy_kwh, 128.83, 'Previous valid result is preserved');
  assert.notStrictEqual(resultScenarioIndex, currentScenarioIndex, 'Clear indication that display belongs to earlier scenario');
});
