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

export async function search(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const defaultSearch = getWordAtPoint(editor);

  const location = vscode.workspace.rootPath || "/";
  const context = 0;
  const sortFiles = false;

  const query = await vscode.window.showInputBox({
    value: defaultSearch,
    valueSelection: [0, (defaultSearch || "").length],
    password: false,
    prompt: "Search",
    placeHolder: "Search term"
  });

  if (query === undefined) {
    return;
  }

  const uri = buildUri({
    query,
    location,
    context,
    sortFiles: sortFiles.toString()
  });

  const doc = await vscode.workspace.openTextDocument(uri);
  vscode.window.showTextDocument(doc, {
    preview: false,
    viewColumn: 1
  });
}
