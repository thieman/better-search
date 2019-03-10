import * as vscode from "vscode";
import { getWordAtPoint } from "./editor";
import { BetterSearchProvider } from "./providers";
import { SearchOptions } from "./search";

function sluggify(inputString: string): string {
  return inputString.replace(/[^a-z0-9]/gi, "_");
}

function buildUri(searchOptions: SearchOptions): vscode.Uri {
  const { query, location, context, sortFiles } = searchOptions;
  return vscode.Uri.parse(
    `${BetterSearchProvider.scheme}:${sluggify(
      query
    )}.better?query=${query}&location=${location}&context=${context}&sortFiles=${sortFiles}`
  );
}

export function searchInFolder(context: any): Promise<void> {
  if (context["fsPath"] !== undefined) {
    return search({ location: context["fsPath"] });
  }
  return search({});
}

export async function search(
  partialOpts: Partial<SearchOptions> = {}
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const defaultSearch = getWordAtPoint(editor);

  let query = partialOpts.query;
  if (query === undefined) {
    query = await vscode.window.showInputBox({
      value: defaultSearch,
      valueSelection: [0, (defaultSearch || "").length],
      password: false,
      prompt: "Search",
      placeHolder: "Search term"
    });
  }

  if (query === undefined) {
    return;
  }

  let opts: SearchOptions = Object.assign(
    {
      query: query,
      location: vscode.workspace.rootPath || "/",
      context: 0,
      sortFiles: "false"
    },
    partialOpts
  );

  const uri = buildUri(opts);

  const doc = await vscode.workspace.openTextDocument(uri);
  vscode.window.showTextDocument(doc, {
    preview: false,
    viewColumn: 1
  });
}
