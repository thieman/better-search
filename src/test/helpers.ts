import * as path from 'path';
import * as vscode from 'vscode';
import { SearchOptions } from '../search';
import { readFileSync } from 'fs';

const WORKSPACE_ROOT = vscode.workspace.workspaceFolders![0];
const CONTAINING_FOLDER_REGEXP = new RegExp(`^Containing Folder:\\s.*(${WORKSPACE_ROOT.name}.*)$`, 'm');
const FILE_PATH_REGEXP = new RegExp(`^File:\\s(.*)$`, 'gm');

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
    return path.resolve(WORKSPACE_ROOT.uri.fsPath, folder);
};

/**
 * Run BetterSearch with specified options
 * @param partialOpts search options
 * @return search result in string
 */
export const runBetterSearch = async (partialOpts: Partial<SearchOptions>): Promise<string> => {
    await vscode.commands.executeCommand('betterSearch.search', partialOpts);
    const editor = vscode.window!.activeTextEditor!;
    return normalizeResultPaths(editor.document.getText());
};

/**
 * Normalize paths (replace backslashes with slashes) in our search results 
 * to make our results output consistent and deterministic
 * @param textResult text buffer of our result 
 */
export const normalizeResultPaths = (textResult: string): string => {
    const replacerOne = (match: string, p1: string) => {
        return 'Containing Folder: ' + p1.replace(/\\/g, '/');
    };
    const replacerTwo = (match: string, p1: string) => {
        return 'File: ' + p1.replace(/\\/g, '/');
    };
    return textResult
        .replace(CONTAINING_FOLDER_REGEXP, replacerOne)
        .replace(FILE_PATH_REGEXP, replacerTwo);
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