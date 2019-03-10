import * as vscode from 'vscode';
import { getWordAtPoint } from './editor';
import { BetterSearchProvider } from './providers';
import { SearchOptions } from './search';

function sluggify(inputString: string): string {
    return inputString.replace(/[^a-z0-9]/gi, '_');
}

function buildUri(searchOptions: SearchOptions): vscode.Uri {
    const { query, location } = searchOptions;
    return vscode.Uri.parse(`${BetterSearchProvider.scheme}:${sluggify(query)}.better?query=${query}&location=${location}`);
}

export function search(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const defaultSearch = getWordAtPoint(editor);

    const location = vscode.workspace.rootPath || '/';

    vscode.window.showInputBox({
        value: defaultSearch,
        valueSelection: [0, (defaultSearch || '').length],
        password: false,
        prompt: "Search",
        placeHolder: "Search term",
    }).then((query: string | undefined): void => {
        if (query === undefined) { return; }

        const uri = buildUri({
            query,
            location,
        });
        vscode.workspace.openTextDocument(uri).then(doc =>
            vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: 1
            })
        );
    });
}
