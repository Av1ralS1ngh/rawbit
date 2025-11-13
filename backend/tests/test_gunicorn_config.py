from importlib import reload


def test_gunicorn_config_defaults():
    import backend.gunicorn_config as cfg

    # Reload to ensure constants are evaluated during test run
    cfg = reload(cfg)

    assert cfg.bind == "0.0.0.0:5007"
    assert cfg.worker_class == "sync"
    assert cfg.timeout == 30
    assert cfg.keepalive == 5
    assert cfg.max_requests == 2000
    assert cfg.max_requests_jitter == 200
