// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';

// Mirroring prediction validation rules and defaults
const NOMINAL_DEFAULTS = {
  chilled_water_rate: 95.0,
  cooling_water_temp: 32.0,
  building_load: 510.0,
  outside_temp: 86.0,
  dew_point: 75.0,
  humidity: 78.0,
  wind_speed: 7.0,
  pressure: 29.82,
  chiller_energy: 128.0,
};

function validatePredictionInputs(formValues) {
  const errors = {};

  if (typeof formValues.chilled_water_rate !== 'number' || isNaN(formValues.chilled_water_rate)) {
    errors.chilled_water_rate = 'Required numeric value.';
  } else if (formValues.chilled_water_rate < 0 || formValues.chilled_water_rate > 500) {
    errors.chilled_water_rate = 'Must be between 0.0 and 500.0 L/sec.';
  }

  if (typeof formValues.cooling_water_temp !== 'number' || isNaN(formValues.cooling_water_temp)) {
    errors.cooling_water_temp = 'Required numeric value.';
  } else if (formValues.cooling_water_temp < 0 || formValues.cooling_water_temp > 80) {
    errors.cooling_water_temp = 'Must be between 0.0 and 80.0 °C.';
  }

  if (typeof formValues.building_load !== 'number' || isNaN(formValues.building_load)) {
    errors.building_load = 'Required numeric value.';
  } else if (formValues.building_load < 0 || formValues.building_load > 5000) {
    errors.building_load = 'Must be between 0.0 and 5000.0 RT.';
  }

  if (typeof formValues.outside_temp !== 'number' || isNaN(formValues.outside_temp)) {
    errors.outside_temp = 'Required numeric value.';
  } else if (formValues.outside_temp < -40 || formValues.outside_temp > 150) {
    errors.outside_temp = 'Must be between -40.0 and 150.0 °F.';
  }

  if (typeof formValues.dew_point !== 'number' || isNaN(formValues.dew_point)) {
    errors.dew_point = 'Required numeric value.';
  } else if (formValues.dew_point < -40 || formValues.dew_point > 150) {
    errors.dew_point = 'Must be between -40.0 and 150.0 °F.';
  }

  if (typeof formValues.humidity !== 'number' || isNaN(formValues.humidity)) {
    errors.humidity = 'Required numeric value.';
  } else if (formValues.humidity < 0 || formValues.humidity > 100) {
    errors.humidity = 'Must be between 0.0% and 100.0%.';
  }

  if (typeof formValues.wind_speed !== 'number' || isNaN(formValues.wind_speed)) {
    errors.wind_speed = 'Required numeric value.';
  } else if (formValues.wind_speed < 0 || formValues.wind_speed > 150) {
    errors.wind_speed = 'Must be between 0.0 and 150.0 mph.';
  }

  if (typeof formValues.pressure !== 'number' || isNaN(formValues.pressure)) {
    errors.pressure = 'Required numeric value.';
  } else if (formValues.pressure < 20 || formValues.pressure > 35) {
    errors.pressure = 'Must be between 20.0 and 35.0 in Hg.';
  }

  if (typeof formValues.chiller_energy !== 'number' || isNaN(formValues.chiller_energy)) {
    errors.chiller_energy = 'Required numeric value.';
  } else if (formValues.chiller_energy < 0) {
    errors.chiller_energy = 'Must be greater than or equal to 0.0 kWh.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

test('1. Valid defaults: nominal baseline passes all client validations', () => {
  const { isValid, errors } = validatePredictionInputs(NOMINAL_DEFAULTS);
  assert.equal(isValid, true);
  assert.deepEqual(errors, {});
});

test('2. Range validation: out-of-bound inputs produce expected validation errors', () => {
  const invalid = {
    ...NOMINAL_DEFAULTS,
    chilled_water_rate: -1.0,
    cooling_water_temp: 95.0,
    building_load: -50,
    humidity: 120,
    pressure: 15.0,
  };
  const { isValid, errors } = validatePredictionInputs(invalid);
  assert.equal(isValid, false);
  assert.ok(errors.chilled_water_rate);
  assert.ok(errors.cooling_water_temp);
  assert.ok(errors.building_load);
  assert.ok(errors.humidity);
  assert.ok(errors.pressure);
});

test('3. In-flight protection: duplicate concurrent submissions are rejected', async () => {
  let callCount = 0;
  let isLoading = false;

  async function executeForecast() {
    if (isLoading) return;
    isLoading = true;
    callCount++;
    await new Promise((r) => setTimeout(r, 40));
    isLoading = false;
  }

  // Trigger three rapid clicks
  const p1 = executeForecast();
  const p2 = executeForecast();
  const p3 = executeForecast();

  await Promise.all([p1, p2, p3]);
  assert.equal(callCount, 1, 'Only one request should be initiated while in-flight');
});

test('4. Failure state preservation: error preserves previous successful forecast', async () => {
  let activeResult = null;
  let backendError = null;

  async function mockPredict(shouldFail) {
    if (shouldFail) {
      backendError = 'Backend 500 error';
      // activeResult intentionally preserved
      return;
    }
    activeResult = {
      predicted_energy_kwh: 123.75,
      predicted_temp_c: 31.60,
      energy_units: 'kWh',
      temperature_units: '°C',
    };
    backendError = null;
  }

  // 1st run succeeds
  await mockPredict(false);
  assert.ok(activeResult);
  assert.equal(activeResult.predicted_energy_kwh, 123.75);
  assert.equal(backendError, null);

  // 2nd run fails
  await mockPredict(true);
  assert.equal(backendError, 'Backend 500 error');
  assert.ok(activeResult, 'Previous forecast must remain accessible');
  assert.equal(activeResult.predicted_energy_kwh, 123.75);
});

test('5. Reset action restores documented nominal defaults and clears error/result states', () => {
  let formValues = {
    chilled_water_rate: 140.0,
    cooling_water_temp: 35.0,
    building_load: 750.0,
    outside_temp: 95.0,
    dew_point: 80.0,
    humidity: 90.0,
    wind_speed: 12.0,
    pressure: 30.1,
    chiller_energy: 190.0,
  };
  let activeResult = { predicted_energy_kwh: 145.2 };
  let backendError = 'Stale error';

  function reset() {
    formValues = { ...NOMINAL_DEFAULTS };
    activeResult = null;
    backendError = null;
  }

  reset();
  assert.deepEqual(formValues, NOMINAL_DEFAULTS);
  assert.equal(activeResult, null);
  assert.equal(backendError, null);
});

test('6. Training support warnings: flags out-of-training values without asserting safety boundaries', () => {
  const TRAINING_SUPPORT_BOUNDS = {
    chilled_water_rate: { min: 72.4, max: 141.5, unit: 'L/sec' },
    cooling_water_temp: { min: 25.8, max: 36.2, unit: '°C' },
    building_load: { min: 200.0, max: 800.0, unit: 'RT' },
  };

  function checkWarning(field, val) {
    const bounds = TRAINING_SUPPORT_BOUNDS[field];
    if (val < bounds.min || val > bounds.max) {
      return `Outside empirical training bounds (${bounds.min} – ${bounds.max} ${bounds.unit}). Model output is extrapolated and not physically constrained.`;
    }
    return null;
  }

  // Nominal values should NOT trigger warnings
  assert.equal(checkWarning('chilled_water_rate', 95.0), null);
  assert.equal(checkWarning('cooling_water_temp', 32.0), null);
  assert.equal(checkWarning('building_load', 510.0), null);

  // Schema-valid but training-extrapolated values MUST trigger non-alarmist warning
  const warnLow = checkWarning('chilled_water_rate', 60.0);
  assert.ok(warnLow && warnLow.includes('extrapolated and not physically constrained'));

  const warnHigh = checkWarning('chilled_water_rate', 160.0);
  assert.ok(warnHigh && warnHigh.includes('extrapolated and not physically constrained'));
});

