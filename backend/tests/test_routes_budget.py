import importlib
from types import SimpleNamespace

import pytest

import routes


@pytest.fixture(autouse=True)
def reset_budget_state():
    routes._budget_time_base = None
    routes._budget_perf_base = None
    yield
    routes._budget_time_base = None
    routes._budget_perf_base = None


def test_budget_now_seeds_and_returns_monotonic(monkeypatch):
    time_values = iter([100.0, 101.0, 102.0])
    perf_values = iter([200.0, 200.0, 205.0, 210.0])

    monkeypatch.setattr(routes.time, "time", lambda: next(time_values))
    monkeypatch.setattr(routes.time, "perf_counter", lambda: next(perf_values))

    first = routes._budget_now()
    second = routes._budget_now()

    assert pytest.approx(first, rel=1e-9) == 100.0
    assert second > first


def test_budget_now_fallbacks_to_wall_clock(monkeypatch):
    routes._budget_time_base = None
    routes._budget_perf_base = None

    monkeypatch.setattr(routes.time, "time", lambda: None)
    monkeypatch.setattr(routes.time, "perf_counter", lambda: None)

    result = routes._budget_now()
    assert result is None
