import * as vscode from "vscode";
import { getWordAtPoint } from "./editor";
import { BetterSearchProvider } from "./providers";
import { SearchOptions } from "./search";
import * as url from "url";

function sluggify(inputString: string): string {
  return inputString.replace(/[^a-z0-9]/gi, "_");
}

function buildUri(searchOptions: SearchOptions): vscode.Uri {
  const { query, location, context, sortFiles } = searchOptions;
  // Need a nonce so we can refresh our results without hitting cache
  const date = Date.now();
  return vscode.Uri.parse(
    `${BetterSearchProvider.scheme}:Σ: ${sluggify(
      query
    )}?query=${query}&location=${location}&context=${context}&sortFiles=${sortFiles}&date=${date}`
  );
}

function optionsFromUri(docUriString: string): SearchOptions {
  const parsed = url.parse(docUriString, true);
  return (parsed.query as unknown) as SearchOptions;
}

async function promptForQuery(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const defaultSearch = getWordAtPoint(editor);

  return await vscode.window.showInputBox({
    value: defaultSearch,
    valueSelection: [0, (defaultSearch || "").length],
    password: false,
    prompt: "Search",
    placeHolder: "Search term"
  });
}

export async function reexecuteSearch(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (editor !== undefined) {
    const docUri = editor.document.uri;
    if (docUri.scheme !== BetterSearchProvider.scheme) {
      return;
    }

    // This is deprecated but I couldn't find a suitable replacement for it.
    // https://github.com/Microsoft/vscode/issues/48945
    // await editor.hide();
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    // Hack and a half, sorry
    return await search(optionsFromUri(`nonsense://whatever?${docUri.query}`));
  }
}

export function searchInFolder(context?: any): Promise<void> {
  if (context !== undefined && context["fsPath"] !== undefined) {
    return search({ location: context["fsPath"] });
  }
  return search({});
}

export async function searchFull(): Promise<void> {
  const query = await promptForQuery();
  const location = await vscode.window.showInputBox({
    value: vscode.workspace.rootPath,
    valueSelection: [0, (vscode.workspace.rootPath || "").length],
    password: false,
    prompt: "Search Location"
  });
  const context = await vscode.window.showInputBox({
    password: false,
    prompt: "Lines of Context",
    placeHolder: "Leave blank for default"
  });

  let opts: Partial<SearchOptions> = { query };
  if (location) {
    opts.location = location;
  }
  if (context) {
    opts.context = parseInt(context);
  }

  return await search(opts);
}

export async function search(
  partialOpts: Partial<SearchOptions> = {}
): Promise<void> {
  let query = partialOpts.query;
  if (query === undefined) {
    query = await promptForQuery();
  }

  if (query === undefined) {
    return;
  }

  let opts: SearchOptions = Object.assign(
    {
      query: query,
      location: vscode.workspace.rootPath || "/",
      context: vscode.workspace.getConfiguration("better-search").context,
      sortFiles: vscode.workspace
        .getConfiguration("better-search")
        .sortFiles.toString()
    },
    partialOpts
  );

  const uri = buildUri(opts);

  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, {
    preview: false,
    viewColumn: 1
  });
}
