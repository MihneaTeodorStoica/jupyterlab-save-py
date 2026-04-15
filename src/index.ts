import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";
import {
  ICommandPalette,
  Notification,
  ToolbarButton,
  showErrorMessage,
} from "@jupyterlab/apputils";
import { PathExt } from "@jupyterlab/coreutils";
import type {
  ICell,
  INotebookContent,
  MultilineString,
} from "@jupyterlab/nbformat";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { Contents } from "@jupyterlab/services";
import { ISettingRegistry } from "@jupyterlab/settingregistry";
import { pythonIcon } from "@jupyterlab/ui-components";
import { DisposableDelegate, IDisposable } from "@lumino/disposable";

const PLUGIN_ID = "jupyterlab-save-py:plugin";
const COMMAND_ID = "jupyterlab-save-py:save";

type SaveFormat = "script" | "percent";

interface ISettings {
  format: SaveFormat;
  overwrite: boolean;
}

const DEFAULT_SETTINGS: ISettings = {
  format: "percent",
  overwrite: true,
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry,
  ) => {
    let settings = { ...DEFAULT_SETTINGS };
    const loadedSettings = await settingRegistry.load(PLUGIN_ID);

    const updateSettings = (): void => {
      const format = loadedSettings.composite.format;
      const overwrite = loadedSettings.composite.overwrite;

      settings = {
        format: format === "script" ? "script" : "percent",
        overwrite: typeof overwrite === "boolean" ? overwrite : true,
      };
    };

    updateSettings();
    loadedSettings.changed.connect(updateSettings);

    app.commands.addCommand(COMMAND_ID, {
      label: "Save .py",
      icon: pythonIcon,
      caption: "Save the active notebook as a sibling Python script",
      isEnabled: () => getActiveNotebook(app, tracker) !== null,
      execute: async () => {
        const panel = getActiveNotebook(app, tracker);

        if (!panel) {
          Notification.error("Save .py only works for an active notebook.");
          return;
        }

        try {
          const outputPath = await saveNotebookAsPython(app, panel, settings);
          Notification.success(`Saved ${outputPath}`, { autoClose: 5000 });
        } catch (reason) {
          const error =
            reason instanceof Error ? reason : new Error(String(reason));
          Notification.error(`Save .py failed: ${error.message}`);
          await showErrorMessage("Save .py failed", error);
        }
      },
    });

    palette.addItem({
      command: COMMAND_ID,
      category: "Notebook Operations",
    });

    app.docRegistry.addWidgetExtension("Notebook", {
      createNew: (panel: NotebookPanel): IDisposable => {
        const button = new ToolbarButton({
          label: "Save .py",
          icon: pythonIcon,
          tooltip: "Save this notebook as a sibling Python script",
          onClick: () => {
            void app.commands.execute(COMMAND_ID);
          },
        });

        panel.toolbar.insertItem(10, "save-py", button);

        return new DisposableDelegate(() => {
          button.dispose();
        });
      },
    });
  },
};

function getActiveNotebook(
  app: JupyterFrontEnd,
  tracker: INotebookTracker,
): NotebookPanel | null {
  const current = tracker.currentWidget;

  if (!current || app.shell.currentWidget !== current) {
    return null;
  }

  return current;
}

async function saveNotebookAsPython(
  app: JupyterFrontEnd,
  panel: NotebookPanel,
  settings: ISettings,
): Promise<string> {
  if (!panel.context.path.endsWith(".ipynb")) {
    throw new Error("The active notebook path does not end with .ipynb.");
  }

  await panel.context.save();

  const model = panel.context.model;
  const notebook = model?.toJSON() as INotebookContent | undefined;

  if (!notebook || notebook.nbformat === undefined) {
    throw new Error("The active notebook model is not available.");
  }

  const script = notebookToPython(notebook, settings.format);
  const outputPath = await resolveOutputPath(
    panel.context.path,
    app.serviceManager.contents,
    settings.overwrite,
  );

  await app.serviceManager.contents.save(outputPath, {
    type: "file",
    format: "text",
    content: script,
  });

  return outputPath;
}

async function resolveOutputPath(
  notebookPath: string,
  contents: Contents.IManager,
  overwrite: boolean,
): Promise<string> {
  const directory = PathExt.dirname(notebookPath);
  const basename = PathExt.basename(notebookPath, ".ipynb");
  const pathFor = (filename: string): string =>
    directory && directory !== "."
      ? PathExt.join(directory, filename)
      : filename;

  const defaultPath = pathFor(`${basename}.py`);

  if (overwrite) {
    return defaultPath;
  }

  for (let index = 0; index < 10000; index++) {
    const candidate =
      index === 0 ? defaultPath : pathFor(`${basename}-${index}.py`);

    if (!(await pathExists(contents, candidate))) {
      return candidate;
    }
  }

  throw new Error("Could not find an available .py filename.");
}

async function pathExists(
  contents: Contents.IManager,
  path: string,
): Promise<boolean> {
  try {
    await contents.get(path, { content: false });
    return true;
  } catch (reason) {
    const response = (reason as { response?: { status?: number } }).response;

    if (response?.status === 404) {
      return false;
    }

    throw reason;
  }
}

function notebookToPython(
  notebook: INotebookContent,
  format: SaveFormat,
): string {
  const parts = notebook.cells.map((cell: ICell, index: number) =>
    cellToPython(cell, index + 1, format),
  );
  const body = parts.filter(Boolean).join("\n\n");

  return body.endsWith("\n") ? body : `${body}\n`;
}

function cellToPython(
  cell: ICell,
  cellNumber: number,
  format: SaveFormat,
): string {
  const source = sourceToString(cell.source);

  if (cell.cell_type === "code") {
    return format === "percent"
      ? `# %%\n${source}`.trimEnd()
      : `# Cell ${cellNumber}\n${source}`.trimEnd();
  }

  if (cell.cell_type === "markdown") {
    const commented = commentSource(source);

    return format === "percent"
      ? `# %% [markdown]\n${commented}`.trimEnd()
      : `# Markdown cell ${cellNumber}\n${commented}`.trimEnd();
  }

  const commented = commentSource(source);

  return format === "percent"
    ? `# %% [raw]\n${commented}`.trimEnd()
    : `# Raw cell ${cellNumber}\n${commented}`.trimEnd();
}

function sourceToString(source: MultilineString): string {
  return Array.isArray(source) ? source.join("") : source;
}

function commentSource(source: string): string {
  if (!source) {
    return "#";
  }

  return source
    .split("\n")
    .map((line) => (line ? `# ${line}` : "#"))
    .join("\n");
}

export default plugin;
