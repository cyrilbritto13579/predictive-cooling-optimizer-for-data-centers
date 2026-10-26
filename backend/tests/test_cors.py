# SPDX-License-Identifier: MIT
"""Unit tests verifying CORS origin normalization in FastAPI app creation."""

import os
import pytest
from starlette.testclient import TestClient

from backend.main import create_app


def test_cors_origin_normalization_with_trailing_slash(monkeypatch: pytest.MonkeyPatch):
    """Verify that an origin configured with a trailing slash permits requests without a trailing slash."""
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://predictive-cooling-optimizer.vercel.app/, 'http://example.com/'",
    )
    app = create_app()
    client = TestClient(app)

    # Browser preflight sends Origin without trailing slash per RFC 6454
    headers = {
        "Origin": "https://predictive-cooling-optimizer.vercel.app",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://predictive-cooling-optimizer.vercel.app"


def test_cors_default_allowed_origins(monkeypatch: pytest.MonkeyPatch):
    """Verify default allowed origins include production Vercel frontend and localhost."""
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    app = create_app()
    client = TestClient(app)

    for origin in [
        "https://predictive-cooling-optimizer.vercel.app",
        "http://localhost:5173",
    ]:
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        }
        response = client.options("/api/health", headers=headers)
        assert response.status_code == 200, f"Failed for origin {origin}"
        assert response.headers.get("access-control-allow-origin") == origin
