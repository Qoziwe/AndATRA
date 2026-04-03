"""Tests for the analytics API endpoints."""


class TestAnalyticsSummary:
    """Tests for GET /api/analytics/summary."""

    def test_summary_default(self, client):
        """GET /api/analytics/summary returns 200 with expected keys."""
        resp = client.get("/api/analytics/summary")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        summary = data["data"]
        assert "total" in summary
        assert "by_category" in summary
        assert "by_district" in summary
        assert "by_priority" in summary
        assert "by_status" in summary

    def test_summary_7d(self, client):
        """GET /api/analytics/summary?period=7d returns data for 7 days."""
        resp = client.get("/api/analytics/summary?period=7d")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert data["data"]["period"] == "7d"


class TestAnalyticsTrends:
    """Tests for GET /api/analytics/trends."""

    def test_trends(self, client):
        """GET /api/analytics/trends returns time-series data."""
        resp = client.get("/api/analytics/trends")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        if data["data"]:
            assert "date" in data["data"][0]
            assert "count" in data["data"][0]


class TestAnalyticsHeatmap:
    """Tests for GET /api/analytics/heatmap."""

    def test_heatmap(self, client):
        """GET /api/analytics/heatmap returns district data."""
        resp = client.get("/api/analytics/heatmap")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        if data["data"]:
            assert "district" in data["data"][0]
            assert "appeal_count" in data["data"][0]
