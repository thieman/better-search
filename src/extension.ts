import * as vscode from "vscode";
import * as commands from "./commands";
import { BetterSearchProvider } from "./providers";

export function activate(context: vscode.ExtensionContext) {
  const provider = new BetterSearchProvider();

  const providerRegistrations = vscode.Disposable.from(
    vscode.workspace.registerTextDocumentContentProvider(
      BetterSearchProvider.scheme,
      provider
    ),
    vscode.languages.registerDocumentLinkProvider(
      { scheme: BetterSearchProvider.scheme },
      provider
    ),
    vscode.languages.registerDocumentHighlightProvider(
      { scheme: BetterSearchProvider.scheme },
      provider
    )
  );

  const searchDisposable = vscode.commands.registerCommand(
    "betterSearch.search",
    commands.search
  );

  const searchInFolderDisposable = vscode.commands.registerCommand(
    "betterSearch.searchInFolder",
    commands.searchInFolder
  );

  const reexecuteSearchDisposable = vscode.commands.registerCommand(
    "betterSearch.reexecute",
    commands.reexecuteSearch
  );

  context.subscriptions.push(providerRegistrations, searchDisposable);
  context.subscriptions.push(providerRegistrations, searchInFolderDisposable);
  context.subscriptions.push(providerRegistrations, reexecuteSearchDisposable);
}

export function deactivate() {}
