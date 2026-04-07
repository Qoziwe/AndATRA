"""Tests for single-account authentication endpoints."""


def test_login_returns_access_token(client):
    """Valid login returns a signed access token and user identity."""
    resp = client.post(
        "/api/auth/login",
        json={"username": "test_operator", "password": "test_password"},
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["access_token"]
    assert data["data"]["user"]["username"] == "test_operator"
    assert data["data"]["user"]["role"] == "operator"


def test_login_rejects_invalid_password(client):
    """Wrong password returns 401."""
    resp = client.post(
        "/api/auth/login",
        json={"username": "test_operator", "password": "wrong"},
    )

    assert resp.status_code == 401
    data = resp.get_json()
    assert data["success"] is False


def test_me_requires_auth_when_enforced(client, app):
    """Current user endpoint should require a valid token when auth is enforced."""
    with app.app_context():
        app.config["ENFORCE_API_AUTH"] = True

    try:
        unauthorized = client.get("/api/auth/me")
        assert unauthorized.status_code == 401

        login_resp = client.post(
            "/api/auth/login",
            json={"username": "test_operator", "password": "test_password"},
        )
        token = login_resp.get_json()["data"]["access_token"]

        authorized = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert authorized.status_code == 200
        data = authorized.get_json()["data"]["user"]
        assert data["username"] == "test_operator"
    finally:
        with app.app_context():
            app.config["ENFORCE_API_AUTH"] = False
