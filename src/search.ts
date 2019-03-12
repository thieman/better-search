import * as child from "child_process";

let rg: any;
let ripgrepInstalled = false;
try {
  rg = require("vscode-ripgrep");
  ripgrepInstalled = true;
} catch {}

const MatchRegex = /(.+?):(\d+):(\d+):(.*)/;
const ContextRegex = /(.+?)-(\d+)-(.*)/;

export interface SearchOptions {
  query: string;
  location: string;
  context: number;
  sortFiles: string;
}

export interface SearchResult {
  filePath: string;
  line: number;
  column?: number;
  content: string;
  isContext: boolean;
}

export class ResultSeparator {}
const RESULT_SEPARATOR = new ResultSeparator();

export function isResultSeparator(obj: any): obj is ResultSeparator {
  return obj === RESULT_SEPARATOR;
}

function quote(str: string): string {
  return str
    .split('"')
    .join('\\"')
    .split("$")
    .join("\\$");
}

function parseResults(
  ripgrepStdout: string
): (SearchResult | ResultSeparator)[] {
  const results: (SearchResult | ResultSeparator)[] = [];

  for (let line of ripgrepStdout.split("\n")) {
    if (line === "--") {
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
        isContext: false
      });
    } else {
      const context = line.match(ContextRegex);
      if (context !== null) {
        results.push({
          filePath: context[1],
          line: parseInt(context[2]),
          content: context[3],
          isContext: true
        });
      }
    }
  }

  return results;
}

async function installRipgrep(): Promise<void> {
  console.log("Installing ripgrep");
  return new Promise((resolve, reject) => {
    child.exec(
      "npm install vscode-ripgrep",
      (err: Error | null, stdout: string, stderr: string): void => {
        if (err) {
          return reject(err);
        }
        console.log(stdout);
        resolve();
      }
    );
  });
}

export async function runSearch(
  opts: SearchOptions
): Promise<(SearchResult | ResultSeparator)[]> {
  // Before the first time we execute a search, check to make sure
  // vscode-ripgrep is installed. Can't do this as a normal
  // dependency since this package only installs a binary for the
  // current OS. If we did it as a normal dep, we'd ship Ubuntu
  // binaries to everyone.
  // https://github.com/thieman/better-search/issues/1
  if (!ripgrepInstalled) {
    await installRipgrep();
    ripgrepInstalled = true;
  }

  const execOptions = {
    cwd: opts.location,
    maxBuffer: 20 * 1024 * 1000
  };

  let command = `${rg.rgPath} ${quote(
    opts.query
  )} --color never --no-heading --column --line-number --context ${
    opts.context
  }`;

  if (opts.sortFiles === "true") {
    command += " --sort-files";
  }

  console.log(`ripgrep command: ${command}`);

  return new Promise((resolve, reject) => {
    child.exec(
      command,
      execOptions,
      (err: Error | null, stdout: string, stderr: string): void => {
        if (err !== null) {
          // ripgrep returns a non-zero exit code if no results are
          // found. Not sure if there's a way to get better signal.
          resolve([]);
        }
        try {
          resolve(parseResults(stdout));
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
