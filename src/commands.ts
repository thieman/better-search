import * as vscode from "vscode";
import { getWordAtPoint } from "./editor";
import { BetterSearchProvider } from "./providers";
import { SearchOptions } from "./search";
import * as url from "url";

function sluggify(inputString: string): string {
  return inputString.replace(/[^a-z0-9]/gi, "_");
}

function buildUri(searchOptions: SearchOptions): vscode.Uri {
  const { query, queryRegex, location, context, sortFiles } = searchOptions;
  // Need a nonce so we can refresh our results without hitting cache
  const date = Date.now();
  const queryRegexStr = queryRegex ? 'y' : 'n';
  return vscode.Uri.parse(
    `${BetterSearchProvider.scheme}:Σ: ${sluggify(
      query
    )}?query=${query}&queryRegex=${queryRegexStr}&location=${location}&context=${context}&sortFiles=${sortFiles}&date=${date}`
  );
}

function optionsFromUri(docUriString: string): SearchOptions {
  const parsed = url.parse(docUriString, true);
  return (parsed.query as unknown) as SearchOptions;
}

async function promptForSearchTerm(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  const defaultSearch = editor ? getWordAtPoint(editor) : undefined;

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

export async function searchInFolder(context?: any): Promise<void> {
  if (context !== undefined && context["fsPath"] !== undefined) {
    return search({ location: context["fsPath"] });
  }
  return search({}); 
}

export async function searchFull(): Promise<void> {
  const query = await promptForSearchTerm();
  const isRegex = await vscode.window.showInputBox({
    value: "n",
    prompt: "Treat this query as a regular expression? (y/n)",
  });

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

  opts.queryRegex = isRegex && isRegex.toLowerCase() === 'y' ? true : false;
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
    query = await promptForSearchTerm();
  }

  if (query === undefined || query === '') {
    vscode.window.showErrorMessage('Better Search: Did not receive valid query, cannot perform search');  
    return;
  }

  let opts: SearchOptions = Object.assign(
    {
      query: query,
      queryRegex: false,
      location: vscode.workspace.rootPath || "/",
      context: vscode.workspace.getConfiguration("betterSearch").context,
      sortFiles: vscode.workspace
        .getConfiguration("betterSearch")
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
