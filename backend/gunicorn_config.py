"""
Generic Gunicorn configuration for running the rawbit backend locally.

This mirrors the settings used in production but contains no environment-specific
secrets or hooks. The config is intentionally simple so open-source users can run
`gunicorn -c backend/gunicorn_config.py routes:app` without modification.
"""

import multiprocessing

bind = "0.0.0.0:5007"
workers = multiprocessing.cpu_count()
worker_class = "sync"
threads = 1
timeout = 30
keepalive = 5

# Recycle workers to prevent memory leaks under sustained load.
max_requests = 2000
max_requests_jitter = 200

# Logging behaviour – stdout/stderr so Docker/local logs capture output.
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Loading the app at master process startup keeps worker forks fast.
preload_app = True
