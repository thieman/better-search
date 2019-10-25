import * as querystring from "querystring";
import {
  CancellationToken,
  DocumentLink,
  DocumentLinkProvider,
  ProviderResult,
  TextDocument,
  TextDocumentContentProvider,
  Uri,
  Range,
  workspace,
  Disposable,
  DocumentHighlightProvider,
  DocumentHighlight,
  DocumentHighlightKind,
  Position,
  LanguageConfiguration,
  languages
} from "vscode";
import * as search from "./search";

const LANGUAGE_EXTENSIONS: { [lang: string]: string } = {
  ts: "typescript",
  js: "javascript",
  py: "python",
  java: "java",
  clj: "clojure",
  go: "go",
  html: "html",
  md: "markdown",
  r: "r",
  sql: "sql",
  c: "c",
  h: "h",
  cpp: "cpp",
  hpp: "cpp",
  lua: "lua",
  rs: "rust",
};

interface RenderState {
  line: number;
  filePath: string;
  readonly searchOptions: search.SearchOptions;
}

export class BetterSearchProvider
  implements
    TextDocumentContentProvider,
    DocumentLinkProvider,
    DocumentHighlightProvider {
  _languages: { [docUri: string]: LanguageConfiguration | undefined };
  _links: { [docUri: string]: DocumentLink[] };
  _highlights: { [docUri: string]: DocumentHighlight[] };
  _queries: { [docUri: string]: string };
  _queryRegexes: { [docUri: string]: RegExp };
  _readyToDispose: { [docUri: string]: boolean };
  _subscriptions: Disposable;

  constructor() {
    this._languages = {};
    this._links = {};
    this._highlights = {};
    this._queries = {};
    this._queryRegexes = {};
    this._readyToDispose = {};

    this._subscriptions = workspace.onDidCloseTextDocument(doc => {
      if (this._readyToDispose[doc.uri.toString()]) {
        delete this._languages[doc.uri.toString()];
        this._links[doc.uri.toString()] = [];
        this._highlights[doc.uri.toString()] = [];
        delete this._queries[doc.uri.toString()];
        for (let key in this._queryRegexes) {
          delete this._queryRegexes[key];
        }
        this._readyToDispose[doc.uri.toString()] = false;
      }
    });
  }

  dispose(): void {
    this._subscriptions.dispose();
  }

  static get scheme(): string {
    return "BetterSearch";
  }

  private uniqueFiles(
    results: (search.SearchResult | search.ResultSeparator)[]
  ): { [filePath: string]: null } {
    const files: { [filePath: string]: null } = {};
    for (let resultUnion of results) {
      if (search.isResultSeparator(resultUnion)) {
        continue;
      }
      const r = resultUnion as search.SearchResult;
      files[r.filePath] = null;
    }
    return files;
  }

  private async detectLanguage(
    results: (search.SearchResult | search.ResultSeparator)[]
  ): Promise<LanguageConfiguration | undefined> {
    const extensions: { [extension: string]: number } = {};
    for (let filePath in this.uniqueFiles(results)) {
      let parts = filePath.split(".");
      const extension = parts[parts.length - 1];
      extensions[extension] =
        extensions[extension] === undefined ? 1 : extensions[extension] + 1;
    }

    // TODO: I couldn't find a way to get VSCode to tell you about the
    // file extensions it knows about targeting its installed languages.
    // Hard-coding some of the major ones here now, can flesh it out later
    // or find a better way to do it if VSCode ships an API.
    let match: LanguageConfiguration | undefined = undefined;
    let highestCount = 0;
    for (let extension in extensions) {
      const count = extensions[extension];
      if (
        count > highestCount &&
        LANGUAGE_EXTENSIONS[extension] !== undefined
      ) {
        highestCount = count;
        match = LANGUAGE_EXTENSIONS[extension] as LanguageConfiguration;
      }
    }

    return match;
  }

  private renderSeparator(state: RenderState): string {
    state.line++;
    return "- - - - - - - - - - - - - - - - - - - - - - - - - - -";
  }

  private renderDocumentHeader(
    docUriString: string,
    state: RenderState,
    results: (search.SearchResult | search.ResultSeparator)[]
  ): string {
    const files = this.uniqueFiles(results);
    let hits = 0;
    for (let r of results) {
      if (!search.isResultSeparator(r)) {
        const result = r as search.SearchResult;
        if (!result.isContext) {
          hits += 1;
        }
      }
    }

    state.line += 4;

    return `Search Query${state.searchOptions.queryRegex ? ' (RegEx):' : ':'} ${this._queries[docUriString]}
Containing Folder: ${state.searchOptions.location}
Total Results: ${hits}
Total Files: ${Object.keys(files).length}\n`;
  }

  private renderResultHeader(
    docUriString: string,
    state: RenderState,
    result: search.SearchResult
  ): string {
    const range = new Range(
      state.line + 1,
      0,
      state.line + 1,
      result.filePath.length + 6
    );
    const uri = Uri.file(
      `${state.searchOptions.location}/${result.filePath}`
    );
    this._links[docUriString].push(new DocumentLink(range, uri));

    state.line += 2;
    state.filePath = result.filePath;
    return `\nFile: ${result.filePath}`;
  }

  private renderContext(
    docUriString: string,
    state: RenderState,
    result: search.SearchResult
  ): string {
    const range = new Range(
      state.line,
      0,
      state.line,
      result.line.toString().length
    );

    let uri = Uri.file(
      `${state.searchOptions.location}/${result.filePath}`
    );
    uri = Uri.parse(`${uri.toString()}#L${result.line}`);
    this._links[docUriString].push(new DocumentLink(range, uri));

    state.line++;
    return `${result.line}   ${result.content}`;
  }

  private renderMatch(
    docUriString: string,
    state: RenderState,
    result: search.SearchResult
  ): string {
    const linkRange = new Range(
      state.line,
      0,
      state.line,
      result.line.toString().length
    );

    let uri = Uri.file(
      `${state.searchOptions.location}/${result.filePath}`
    );
    uri = Uri.parse(`${uri.toString()}#L${result.line}`);
    this._links[docUriString].push(new DocumentLink(linkRange, uri));

    const regexp = this._queryRegexes[docUriString];
    const matches = result.content.match(regexp);
    if (matches !== null) {
      const padding = result.line.toString().length + 3;

      // run through each match and update position to add 
      // hightlight for all matches
      let index = 0;
      matches.forEach(match => {
        const position = index === 0 ? index : index + match.length;
        index = result.content.indexOf(match, position);
        const highlightRange = new Range(
          state.line,
          padding + index,
          state.line,
          padding + index + match.length
        );
        this._highlights[docUriString].push(
          new DocumentHighlight(highlightRange, DocumentHighlightKind.Read)
        );
      });
    }

    state.line++;
    return `${result.line}   ${result.content}`;
  }

  private formatResults(rawResults: string[]): string {
    return rawResults.join("\n");
  }

  async provideTextDocumentContent(
    uri: Uri,
    token: CancellationToken
  ): Promise<string> {
    const opts = (querystring.parse(
      uri.query
    ) as unknown) as search.SearchOptions;
    opts.queryRegex = opts.queryRegex as any === 'y';
    const uriString = uri.toString();

    this._links[uriString] = [];
    this._highlights[uriString] = [];
    this._queries[uriString] = opts.query as string;
    this._queryRegexes[uriString] = new RegExp(`(${opts.query})`, 'g');

    const results = await search.runSearch(opts);
    const language = await this.detectLanguage(results);
    this._languages[uriString] = language;

    let state: RenderState = { line: 0, filePath: "", searchOptions: opts };

    const documentHeader = this.renderDocumentHeader(uriString, state, results);

    let addSeparatorOnNext = false;
    const rawResults = results.map(
      function(
        this: BetterSearchProvider,
        resultUnion: search.SearchResult | search.ResultSeparator
      ): string | null {
        if (search.isResultSeparator(resultUnion)) {
          addSeparatorOnNext = true;
          return null;
        }

        // Compiler is freaking out if I try to do this in an else, not sure why
        let result = resultUnion as search.SearchResult;
        const thisResult: string[] = [];

        if (addSeparatorOnNext && result.filePath === state.filePath) {
          thisResult.push(this.renderSeparator(state));
        }
        addSeparatorOnNext = false;

        if (state.filePath !== result.filePath) {
          thisResult.push(this.renderResultHeader(uriString, state, result));
        }

        if (result.isContext) {
          thisResult.push(this.renderContext(uriString, state, result));
        } else {
          thisResult.push(this.renderMatch(uriString, state, result));
        }

        return thisResult.join("\n");
      }.bind(this)
    );

    return (
      documentHeader +
      this.formatResults(rawResults.filter(elem => elem !== null) as string[])
    );
  }

  async provideDocumentLinks(
    document: TextDocument,
    token: CancellationToken
  ): Promise<DocumentLink[]> {
    // Hack, not sure where the best place is to run this. Can't run it
    // in the content provider since I don't have an actual TextDocument yet
    const language = this._languages[document.uri.toString()];
    if (language !== undefined) {
      await languages.setTextDocumentLanguage(document, language as string);
    }
    this._readyToDispose[document.uri.toString()] = true;
    // End hack

    return this._links[document.uri.toString()];
  }

  provideDocumentHighlights(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<DocumentHighlight[]> {
    return this._highlights[document.uri.toString()];
  }
}
