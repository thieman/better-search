import * as querystring from 'querystring';
import { CancellationToken, DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, TextDocumentContentProvider, Uri, Range, workspace, Disposable } from 'vscode';
import * as search from './search';

interface RenderState {
    line: number;
    filePath: string;
}

export class BetterSearchProvider implements TextDocumentContentProvider, DocumentLinkProvider  {
    _links: {[docUri: string]: DocumentLink[]};
    _subscriptions: Disposable;

    constructor() {
        this._links = {};
        this._subscriptions = workspace.onDidCloseTextDocument(doc => {
            this._links[doc.uri.toString()] = [];
        });
    }

    dispose(): void {
        this._subscriptions.dispose();
    }

    static get scheme(): string {
        return 'BetterSearch';
    }

    private renderSeparator(state: RenderState): string {
        state.line++;
        return '--';
    }

    private renderHeader(docUriString: string, state: RenderState, result: search.SearchResult): string {
        const range = new Range(state.line + 2, 0, state.line + 2, result.filePath.length + 6);
        const uri = Uri.parse(`file://${workspace.rootPath}/${result.filePath}`);
        this._links[docUriString].push(new DocumentLink(range, uri));

        state.line += 3;
        state.filePath = result.filePath;
        return `\n\nFile: ${result.filePath}`;
    }

    private renderContext(docUriString: string, state: RenderState, result: search.SearchResult): string {
        const range = new Range(state.line, 0, state.line, result.line.toString().length);
        const uri = Uri.parse(`file://${workspace.rootPath}/${result.filePath}#L${result.line}`);
        this._links[docUriString].push(new DocumentLink(range, uri));

        state.line++;
        return `${result.line}   ${result.content}`;
    }

    private renderMatch(docUriString: string, state: RenderState, result: search.SearchResult): string {
        const range = new Range(state.line, 0, state.line, result.line.toString().length);
        const uri = Uri.parse(`file://${workspace.rootPath}/${result.filePath}#L${result.line}`);
        this._links[docUriString].push(new DocumentLink(range, uri));

        state.line++;
        return `${result.line}   ${result.content}`;
    }

    private formatResults(rawResults: string[]): string {
        return rawResults.join('\n');
    }

    provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
        const uriString = uri.toString();
        this._links[uriString] = [];

        const params = querystring.parse(uri.query);
        const opts: search.SearchOptions = {
            query: params['query'] as string,
        };

        return search.runSearch(opts).then((results: (search.SearchResult | search.ResultSeparator)[]) => {
            let state: RenderState = {line: 0, filePath: ''};

            const rawResults = results.map(function(this: BetterSearchProvider, resultUnion: (search.SearchResult | search.ResultSeparator)): string {
                if (search.isResultSeparator(resultUnion)) {
                    return this.renderSeparator(state);
                }

                // Compiler is freaking out if I try to do this in an else, not sure why
                let result = (resultUnion as search.SearchResult);
                const thisResult: string[] = [];

                if (state.filePath !== result.filePath) {
                    thisResult.push(this.renderHeader(uriString, state, result));
                }

                if (result.isContext) {
                    thisResult.push(this.renderContext(uriString, state, result));
                } else {
                    thisResult.push(this.renderMatch(uriString, state, result));
                }

                return thisResult.join('\n');
            }.bind(this));

            return this.formatResults(rawResults);
        });
    }

    provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<DocumentLink[]> {
        return this._links[document.uri.toString()];
    }
}
