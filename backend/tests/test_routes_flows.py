from pathlib import Path

import orjson
import pytest

import routes


@pytest.fixture
def temp_flows_dir(tmp_path, monkeypatch):
    original_dir = routes.FLOWS_DIR
    monkeypatch.setattr(routes, "FLOWS_DIR", tmp_path)
    yield tmp_path
    monkeypatch.setattr(routes, "FLOWS_DIR", original_dir)


def test_build_flow_catalog_formats_labels(tmp_path, monkeypatch):
    flow_dir = tmp_path / "flows"
    flow_dir.mkdir()
    (flow_dir / "p1_intro_flow.json").write_text("{}")
    (flow_dir / "basic.json").write_text("{}")

    monkeypatch.setattr(routes, "FLOWS_DIR", flow_dir)

    catalog = routes._build_flow_catalog()
    assert catalog == [
        {
            "slug": "basic",
            "label": "basic",
            "relativePath": "src/my_tx_flows/basic.json",
            "apiPath": "/flows/basic",
        },
        {
            "slug": "p1_intro_flow",
            "label": "intro flow",
            "relativePath": "src/my_tx_flows/p1_intro_flow.json",
            "apiPath": "/flows/p1_intro_flow",
        },
    ]


def test_build_flow_catalog_handles_missing_directory(tmp_path, monkeypatch):
    missing = tmp_path / "missing"
    monkeypatch.setattr(routes, "FLOWS_DIR", missing)
    assert routes._build_flow_catalog() == []


def test_find_flow_path_validates_slug(temp_flows_dir):
    (temp_flows_dir / "valid.json").write_text("{}")

    assert routes._find_flow_path("valid") == temp_flows_dir / "valid.json"
    assert routes._find_flow_path("invalid.slug") is None
    assert routes._find_flow_path("missing") is None


def test_get_flow_returns_error_when_unreadable(temp_flows_dir, monkeypatch):
    target = temp_flows_dir / "example.json"
    target.write_bytes(orjson.dumps({"hello": "world"}))

    original_read_bytes = Path.read_bytes

    def fake_read_bytes(self):
        if self == target:
            raise OSError("denied")
        return original_read_bytes(self)

    monkeypatch.setattr(Path, "read_bytes", fake_read_bytes)

    routes.app.config["TESTING"] = True
    client = routes.app.test_client()
    resp = client.get("/flows/example")
    assert resp.status_code == 500
    assert resp.get_json() == {"error": "flow_not_readable"}


def test_bulk_calculate_uses_budget_tracker(monkeypatch):
    called = {"now": 0, "check": False, "record": False}

    def fake_budget_now():
        called["now"] += 1
        return 123.0

    class FakeTracker:
        def check(self, key, now):
            called["check"] = True
            assert now == 123.0
            return True, 0.0

        def record(self, key, duration, now):
            called["record"] = True

    monkeypatch.setattr(routes, "_budget_now", fake_budget_now)
    monkeypatch.setattr(routes, "computation_budget", FakeTracker())
    monkeypatch.setattr(
        routes,
        "bulk_calculate_logic",
        lambda nodes, edges: (nodes, []),
    )

    routes.app.config["TESTING"] = True
    client = routes.app.test_client()

    resp = client.post(
        "/bulk_calculate",
        json={"nodes": [{"id": "n1", "data": {}}], "edges": [], "version": 1},
    )

    assert resp.status_code == 200
    assert called["now"] >= 1
    assert called["check"] is True
    assert called["record"] is True


def test_healthz_reports_version(monkeypatch):
    routes.app.config["TESTING"] = True
    monkeypatch.setattr(routes, "APP_VERSION", "test-version", raising=False)
    client = routes.app.test_client()
    resp = client.get("/healthz")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["version"] == "test-version"
