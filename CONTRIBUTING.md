# Contributing

## Development Setup

```bash
uv sync
uv run jlpm install
uv run jlpm build
uv run jupyter lab
```

## Validation

Run these checks before opening a pull request:

```bash
uv run jlpm build:lib
uv run python -m build
uv run twine check dist/*
uv run jupyter labextension list
```

The build command creates `dist/`, `lib/`, and `jupyterlab_save_py/labextension/`.
These are generated artifacts and should not be committed.

## Release Checklist

1. Update the version in `pyproject.toml`, `package.json`, and
   `jupyterlab_save_py/__init__.py`.
2. Update `CHANGELOG.md`.
3. Run:

   ```bash
   uv sync --frozen
   uv run jlpm build:lib
   uv run python -m build
   uv run twine check dist/*
   ```

4. Commit the release changes and tag the release:

   ```bash
   git tag v0.1.0
   git push origin main --tags
   ```

5. Create a GitHub Release for the tag.
6. The PyPI publishing workflow runs from the GitHub Release.

## PyPI Trusted Publishing

Configure the PyPI project with this GitHub trusted publisher:

- Owner: `mihnea`
- Repository: `jupyterlab-save-py`
- Workflow: `publish.yml`
- Environment: `pypi`

The workflow uses OpenID Connect, so no PyPI API token is needed in GitHub
secrets.
