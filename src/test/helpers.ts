import * as path from 'path';
import * as vscode from 'vscode';
import { SearchOptions } from '../search';
import { readFileSync } from 'fs';

/**
 * Delay the execution of code for a specified amount of time
 * @param ms Milliseconds to delay the promise
 */
export const delay = (ms: number): Promise<void> => new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
});

/**
 * Get path to samples folder
 * @param folder folder with samples.
 */
export const getSamplesLocation = (folder: string = ''): string => {
    const root = vscode.workspace.workspaceFolders![0];
    return path.resolve(root.uri.fsPath, folder);
};

/**
 * Run BetterSearch with specified options
 * @param partialOpts search options
 * @return search result in string
 */
export const runBetterSearch = async (partialOpts: Partial<SearchOptions>): Promise<string> => {
    await vscode.commands.executeCommand('betterSearch.search', partialOpts);
    const editor = vscode.window!.activeTextEditor!;
    return editor.document.getText();
};

/**
 * Read file contents
 * @param filePath relative path to file
 * @return file context in string format
 */
export const read = (filePath: string): string => {
    const resolvedPath = path.resolve(__dirname, '../../src/test/', filePath);
    return readFileSync(resolvedPath).toString();
};