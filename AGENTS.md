# Repository Guidelines

## Project Structure & Module Organization
`src/index.ts` contains the full JupyterLab plugin: command registration, toolbar wiring, settings handling, and notebook-to-Python conversion. Python packaging lives in `pyproject.toml` and `jupyterlab_save_py/__init__.py`. User-facing settings schema is in `schema/plugin.json`, and styling is limited to `style/index.css`.

Generated outputs include `lib/`, `dist/`, and `jupyterlab_save_py/labextension/`; treat them as build artifacts, not source. Keep new logic in `src/` unless it is packaging metadata or release documentation.

## Build, Test, and Development Commands
- `uv sync`: create or update the local Python environment.
- `uv run jlpm install`: install frontend dependencies.
- `uv run jlpm build`: compile TypeScript and build the development labextension.
- `uv run jupyter lab`: launch JupyterLab against the local editable install.
- `uv run jlpm watch`: watch TypeScript and labextension changes during development.
- `uv run python -m build`: build source and wheel distributions into `dist/`.
- `uv run twine check dist/*`: validate distribution metadata before release.
- `uv run jupyter labextension list`: confirm the extension is discoverable by JupyterLab.

## Coding Style & Naming Conventions
Use 2-space indentation and keep TypeScript aligned with the existing Prettier output. Run `uv run jlpm prettier` before submitting formatting-heavy changes, and use `uv run jlpm lint` as the formatting check. Prefer descriptive camelCase for functions and variables, SCREAMING_SNAKE_CASE for plugin constants, and keep command IDs and schema keys stable once published.

## Testing Guidelines
There is no dedicated automated test suite yet. For each change, run `uv run jlpm build` and perform manual validation in JupyterLab with a real `.ipynb` file. Cover both settings modes (`percent` and `script`) and verify overwrite behavior when `overwrite` is `true` and `false`.

## Commit & Pull Request Guidelines
Recent history uses short, imperative subjects such as `Add caching for uv and Yarn packages in CI workflows`. Follow that pattern: one-line summary in present tense, scoped to the visible change. Pull requests should explain user impact, list validation commands, link related issues, and include screenshots or a short recording when toolbar or command-palette behavior changes.

## Release & Packaging Notes
When cutting a release, update versions in `pyproject.toml`, `package.json`, and `jupyterlab_save_py/__init__.py`, then update `CHANGELOG.md`. Do not commit generated build directories unless the release process explicitly requires them.
