# jupyterlab-save-py

[![CI](https://github.com/MihneaTeodorStoica/jupyterlab-save-py/.github/workflows/ci.yml/badge.svg)](https://github.com/MihneaTeodorStoica/jupyterlab-save-py/.github/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/jupyterlab-save-py.svg)](https://pypi.org/project/jupyterlab-save-py/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`jupyterlab-save-py` is a JupyterLab 4 prebuilt frontend extension that adds a
notebook toolbar button and command palette item named **Save .py**.

The command converts the active `.ipynb` notebook to a sibling `.py` file on the
same Jupyter server using JupyterLab's built-in contents API. It does not run a
separate service and does not install a Jupyter Server extension.

## Features

- JupyterLab 4.x prebuilt frontend extension
- Toolbar button labeled **Save .py** for notebooks
- Command palette command labeled **Save .py**
- Saves next to the active notebook with the same basename and `.py` extension
- Uses the JupyterLab contents manager, not browser downloads
- Configurable output format:
  - `percent`: `# %%` cell markers
  - `script`: plain Python with cell comments
- Configurable overwrite behavior

## Install

From PyPI:

```bash
pip install jupyterlab-save-py
```

From this repository:

```bash
uv sync
uv pip install -e .
```

Then start JupyterLab:

```bash
jupyter lab
```

## Settings

Open JupyterLab's settings editor and search for `Save .py`.

Default settings:

```json
{
  "format": "percent",
  "overwrite": true
}
```

When `overwrite` is `false`, existing files are not replaced. The extension will
save to `name-1.py`, `name-2.py`, and so on.

## Development

Install dependencies into `.venv` with `uv`:

```bash
uv sync
uv run jlpm install
uv run jlpm build
uv pip install -e .
```

Run JupyterLab:

```bash
uv run jupyter lab
```

Watch TypeScript and labextension builds during development:

```bash
uv run jlpm watch
```

## Build

Build frontend assets and Python distributions:

```bash
uv run jlpm install
uv run jlpm build:prod
uv run python -m build
```

The distributions are written to `dist/`.

## Publish

This repository is configured for PyPI Trusted Publishing from GitHub Releases.
Configure the PyPI project with:

- Owner: `mihnea`
- Repository: `jupyterlab-save-py`
- Workflow: `publish.yml`
- Environment: `pypi`

Manual upload is also possible:

```bash
uv run python -m twine upload dist/*
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release checklist.

## License

MIT
