import * as vscode from 'vscode';
import { rgPath } from 'vscode-ripgrep';
import * as child from 'child_process';

const MatchRegex = /(.+?):(\d+):(\d+):(.*)/;
const ContextRegex = /(.+?)-(\d+)-(.*)/;

export interface SearchOptions {
    query: string;
    // TODO: sortFiles bool
    // TODO: context number
}

export interface SearchResult {
    filePath: string;
    line: number;
    column?: number;
    content: string;
    isContext: boolean;
}

export class ResultSeparator { }
const RESULT_SEPARATOR = new ResultSeparator();

export function isResultSeparator(obj: any): obj is ResultSeparator {
    return obj === RESULT_SEPARATOR;
}

function quote(str: string): string {
	return str.split("\"").join("\\\"").split("$").join("\\$");
}

function parseResults(ripgrepStdout: string): (SearchResult | ResultSeparator)[] {
    const results: (SearchResult | ResultSeparator)[] = [];
    for (let line of ripgrepStdout.split('\n')) {
        if (line === '--') {
            results.push(RESULT_SEPARATOR);
            continue;
        }

        const matched = line.match(MatchRegex);
        if (matched !== null) {
            results.push({
                filePath: matched[1],
                line: parseInt(matched[2]),
                column: parseInt(matched[3]),
                content: matched[4],
                isContext: false,
            });
        } else {
            const context = line.match(ContextRegex);
            if (context !== null) {
                results.push({
                    filePath: context[1],
                    line: parseInt(context[2]),
                    content: context[3],
                    isContext: true,
                });
            }
        }
    }

    results.pop();  // removes extraneous separator
    return results;
}

export function runSearch(opts: SearchOptions): Promise<(SearchResult | ResultSeparator)[]> {
    return new Promise<(SearchResult | ResultSeparator)[]>((resolve, reject) => {
        const execOptions = {
            cwd: vscode.workspace.rootPath,
            maxBuffer: 1024 * 1000,
        };

        const command = `${rgPath} ${quote(opts.query)} --color never --no-heading --column --line-number --context 2`;

        child.exec(command, execOptions, (err: Error | null, stdout: string, stderr: string): void => {
            if (err !== null) { reject(err); }
            try {
                resolve(parseResults(stdout));
            } catch(error) {
                reject(error);
            }
        });
    });
}
