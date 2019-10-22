import { getRipgrepExecutablePath } from "./ripgrep";
import * as execa from "execa";

const MatchRegex = /(.+?):(\d+):(\d+):(.*)/;
const ContextRegex = /(.+?)-(\d+)-(.*)/;

export interface SearchOptions {
  query: string;
  queryRegex: boolean;
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

export async function runSearch(
  opts: SearchOptions
): Promise<(SearchResult | ResultSeparator)[]> {
  const execOptions = {
    cwd: opts.location,
    stdin: 'ignore',
  };

  let command: string[] = [
    (await getRipgrepExecutablePath()) as string,
    opts.query,
    "--color",
    "never",
    "--no-heading",
    "--column",
    "--line-number",
    "--context",
    opts.context.toString()
  ];

  if (!opts.queryRegex) {
    command.push("--fixed-strings");
  }

  if (opts.sortFiles === "true") {
    command.push("--sort-files");
  }

  console.log(command);

  try {
    const {stdout} = await execa(
      command[0],
      command.slice(1),
      execOptions as any,
    );
    return parseResults(stdout);
  } catch (e) {
    // ripgrep returns a non-zero exit code if no results are
    // found. Not sure if there's a way to get better signal.
    return [];
  }
}
