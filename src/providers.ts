import * as querystring from 'querystring';
import { CancellationToken, DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, TextDocumentContentProvider, Uri } from 'vscode';
import * as search from './search';

interface RenderState {
    line: number;
    filePath: string;        
}

export class BetterSearchProvider implements TextDocumentContentProvider, DocumentLinkProvider  {
    _links: DocumentLink[];

    constructor() { 
        this._links = [];
    }

    dispose(): void {
        this._links.length = 0;
    }

    static get scheme(): string {
        return 'BetterSearch';
    }    

    private renderSeparator(state: RenderState): string {
        state.line++;
        return '--';        
    }

    private renderHeader(state: RenderState, result: search.SearchResult): string {
        state.line += 3;
        state.filePath = result.filePath;
        return `\n\nFile: ${result.filePath}`;
    }

    private renderContext(state: RenderState, result: search.SearchResult): string {
        state.line++;
        return `${result.line}   ${result.content}`;
    }
    
    private renderMatch(state: RenderState, result: search.SearchResult): string {
        state.line++;        
        return `${result.line}   ${result.content}`;
    }    

    private formatResults(rawResults: string[]): string {
        return rawResults.join('\n');
    }

    provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
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
                    thisResult.push(this.renderHeader(state, result));
                }

                if (result.isContext) {
                    thisResult.push(this.renderContext(state, result));
                } else {
                    thisResult.push(this.renderMatch(state, result));
                }
                
                return thisResult.join('\n');
            }.bind(this));
            
            return this.formatResults(rawResults);
        });
    }

    provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<DocumentLink[]> {
        return this._links;
    }
}