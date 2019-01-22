import * as vscode from 'vscode';

export function getWordAtPoint(editor: vscode.TextEditor): string | undefined {
    if (!editor.selection.isEmpty) {
        return;
    }
    const currentPosition = editor.selection.active;
    const wordRange = editor.document.getWordRangeAtPosition(currentPosition);
    if (wordRange !== undefined) {
        return editor.document.getText(wordRange);
    }
}
