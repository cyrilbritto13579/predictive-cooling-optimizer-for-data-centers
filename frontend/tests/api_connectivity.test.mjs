// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Reproduction of buildApiUrl helper
 */
function buildApiUrl(baseUrl, endpoint) {
  const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

class MockApiError extends Error {
  constructor(statusCode, detail, errorType = 'ApiError') {
    super(detail);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.detail = detail;
  }
}

/**
 * Controller test harness for error classification
 */
class ControllerErrorHarness {
  constructor(api, apiBaseUrl = 'https://predictive-cooling-api.onrender.com') {
    this.api = api;
    this.apiBaseUrl = apiBaseUrl;
    this.state = {
      isLoading: true,
      error: null,
      errorDetail: null,
      currentFrame: null,
      totalSteps: 100,
      playbackStatus: 'idle',
    };
  }

  async init() {
    this.state.isLoading = true;
    this.state.error = null;
    this.state.errorDetail = null;

    try {
      const total = await this.api.getSampleTotalRows();
      if (typeof total !== 'number' || total <= 0) {
        throw new Error('Invalid sample dataset total rows.');
      }

      const step0 = await this.api.step(0);
      this.state.totalSteps = total;
      this.state.currentFrame = step0.frame;
      this.state.isLoading = false;
      this.state.error = null;
      this.state.errorDetail = null;
      this.state.playbackStatus = 'idle';
    } catch (err) {
      let msg = 'Initialization failed.';
      let detail = 'Please verify the backend service is running and accessible.';

      if (err instanceof MockApiError) {
        if (err.statusCode === 408 || err.errorType === 'TimeoutError') {
          msg = 'Backend service request timed out.';
          detail =
            'The server took too long to respond. If running on a free cloud tier (e.g., Render), the instance may be waking up from sleep. Please retry in a few moments.';
        } else if (err.statusCode === 0 || err.errorType === 'NetworkError') {
          msg = 'Unable to connect to backend service.';
          detail = `Could not connect to ${this.apiBaseUrl}. Ensure the backend service is operational, reachable, and CORS permissions allow requests.`;
        } else if (err.statusCode === 404) {
          msg = 'Simulation endpoint not found (HTTP 404).';
          detail = `The sample data or simulation endpoint was not found at ${this.apiBaseUrl}. Verify API base URL routing and endpoint paths.`;
        } else if (err.statusCode >= 500) {
          msg = `Backend service error (HTTP ${err.statusCode}).`;
          detail = err.detail || 'The server encountered an error while retrieving simulation telemetry.';
        } else {
          msg = `API request failed (HTTP ${err.statusCode}).`;
          detail = err.detail || 'The server rejected the simulation request.';
        }
      } else if (err instanceof Error) {
        msg = err.message;
        detail = 'Invalid or unexpected data received during simulation initialization.';
      }

      this.state.isLoading = false;
      this.state.error = msg;
      this.state.errorDetail = detail;
      this.state.playbackStatus = 'error';
    }
  }
}

test('1. URL builder normalization: strips trailing slash from base and avoids double slashes', () => {
  const cases = [
    {
      base: 'https://predictive-cooling-api.onrender.com/',
      endpoint: '/api/data/sample?offset=0&limit=5',
      expected: 'https://predictive-cooling-api.onrender.com/api/data/sample?offset=0&limit=5',
    },
    {
      base: 'https://predictive-cooling-api.onrender.com',
      endpoint: '/api/data/sample?offset=0&limit=5',
      expected: 'https://predictive-cooling-api.onrender.com/api/data/sample?offset=0&limit=5',
    },
    {
      base: 'https://predictive-cooling-api.onrender.com///',
      endpoint: 'api/simulation/step',
      expected: 'https://predictive-cooling-api.onrender.com/api/simulation/step',
    },
    {
      base: 'http://localhost:8000',
      endpoint: '/api/health',
      expected: 'http://localhost:8000/api/health',
    },
  ];

  for (const c of cases) {
    const actual = buildApiUrl(c.base, c.endpoint);
    assert.equal(actual, c.expected, `Mismatch for base: ${c.base} and endpoint: ${c.endpoint}`);
    assert.equal(actual.includes('//api'), false, 'URL must not contain duplicate slash //api');
  }
});

test('2. Error handling: NetworkError / CORS failure produces actionable message without hardcoded localhost', async () => {
  const failingApi = {
    getSampleTotalRows: async () => {
      throw new MockApiError(0, 'Failed to fetch', 'NetworkError');
    },
    step: async () => assert.fail('Should not reach step'),
  };

  const harness = new ControllerErrorHarness(failingApi, 'https://predictive-cooling-api.onrender.com');
  await harness.init();

  assert.equal(harness.state.isLoading, false);
  assert.equal(harness.state.playbackStatus, 'error');
  assert.equal(harness.state.error, 'Unable to connect to backend service.');
  assert.match(harness.state.errorDetail, /https:\/\/predictive-cooling-api\.onrender\.com/);
  assert.match(harness.state.errorDetail, /CORS/);
  assert.equal(harness.state.errorDetail.includes('127.0.0.1:8000'), false);
});

test('3. Error handling: Timeout (HTTP 408) guides user regarding cloud spin-up', async () => {
  const timeoutApi = {
    getSampleTotalRows: async () => {
      throw new MockApiError(408, 'Request timed out waiting for backend server response.', 'TimeoutError');
    },
    step: async () => assert.fail('Should not reach step'),
  };

  const harness = new ControllerErrorHarness(timeoutApi);
  await harness.init();

  assert.equal(harness.state.playbackStatus, 'error');
  assert.equal(harness.state.error, 'Backend service request timed out.');
  assert.match(harness.state.errorDetail, /waking up from sleep/);
});

test('4. Error handling: HTTP 404 endpoint not found identifies URL routing', async () => {
  const notFoundApi = {
    getSampleTotalRows: async () => {
      throw new MockApiError(404, 'Not Found', 'HttpError');
    },
    step: async () => assert.fail('Should not reach step'),
  };

  const harness = new ControllerErrorHarness(notFoundApi);
  await harness.init();

  assert.equal(harness.state.playbackStatus, 'error');
  assert.equal(harness.state.error, 'Simulation endpoint not found (HTTP 404).');
  assert.match(harness.state.errorDetail, /routing/);
});

test('5. Error handling: Successful retry after failure restores healthy state and clears errors', async () => {
  let shouldFail = true;
  const recoverableApi = {
    getSampleTotalRows: async () => {
      if (shouldFail) throw new MockApiError(0, 'Failed to fetch', 'NetworkError');
      return 100;
    },
    step: async (idx) => ({
      frame: { step_index: idx, predicted_energy_kwh: 125.0, predicted_temp_c: 31.0 },
      next_state: { current_index: idx + 1, is_running: true, total_steps: 100 },
    }),
  };

  const harness = new ControllerErrorHarness(recoverableApi);
  await harness.init();

  assert.equal(harness.state.playbackStatus, 'error');
  assert.ok(harness.state.error);
  assert.ok(harness.state.errorDetail);

  // Now backend is reachable
  shouldFail = false;
  await harness.init();

  assert.equal(harness.state.playbackStatus, 'idle');
  assert.equal(harness.state.error, null);
  assert.equal(harness.state.errorDetail, null);
  assert.equal(harness.state.currentFrame.step_index, 0);
  assert.equal(harness.state.totalSteps, 100);
});
