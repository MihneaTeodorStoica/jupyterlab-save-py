"""JupyterLab extension entry points for jupyterlab-save-py."""

from __future__ import annotations

__version__ = "0.1.3"


def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "labextension", "dest": "jupyterlab-save-py"}]
