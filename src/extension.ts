import * as vscode from 'vscode';
import * as commands from './commands';
import { BetterSearchProvider } from './providers';

export function activate(context: vscode.ExtensionContext) {
	const provider = new BetterSearchProvider();

	const providerRegistrations = vscode.Disposable.from(
		vscode.workspace.registerTextDocumentContentProvider(BetterSearchProvider.scheme, provider),
		vscode.languages.registerDocumentLinkProvider({scheme: BetterSearchProvider.scheme}, provider),
		vscode.languages.registerDocumentHighlightProvider({scheme: BetterSearchProvider.scheme}, provider),
	);

	let disposable = vscode.commands.registerCommand('betterSearch.search', commands.search);

	context.subscriptions.push(providerRegistrations, disposable);
}

export function deactivate() {}
