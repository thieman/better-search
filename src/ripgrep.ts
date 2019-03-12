import * as fs from "fs";
import * as stream from "stream";
import * as path from "path";
import * as os from "os";
import * as request from "request";
import * as tar from "tar-fs";
let gunzip = require("gunzip-maybe");
import { context } from "./extension";

const TARBALL_URL =
  "https://registry.npmjs.org/vscode-ripgrep/-/vscode-ripgrep-1.2.5.tgz";

async function ensureStoragePath(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) {
      fs.mkdir(path, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function downloadVscodeRipgrep(): Promise<void> {
  const destination = path.join(context.globalStoragePath, "vscode-ripgrep");

  if (!fs.existsSync(destination)) {
    await new Promise((resolve, reject) => {
      fs.mkdir(destination, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  const stream: stream.Readable = request(TARBALL_URL)
    .pipe(gunzip())
    .pipe(tar.extract(destination));

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", err => reject(err));
  });
}

async function runVscodeRipgrepInstaller(): Promise<null> {
  const download = require(path.join(
    context.globalStoragePath,
    "vscode-ripgrep",
    "package",
    "lib",
    "download.js"
  ));

  const opts = {
    platform: os.platform(),
    version: "0.10.0-pcre",
    arch: "unknown"
  };

  switch (opts.platform) {
    case "darwin":
      opts.arch = "x64";
      break;
    case "win32":
      opts.version = "0.10.0-patch.0";
      opts.arch = os.arch();
      break;
    case "linux":
      opts.arch = os.arch();
      break;
    default:
      throw new Error("Unknown platform: " + opts.platform);
  }

  return await download(opts);
}

export async function getRipgrepExecutablePath(): Promise<string | null> {
  try {
    const rg = require(path.join(
      context.globalStoragePath,
      "vscode-ripgrep",
      "package",
      "lib",
      "index.js"
    ));
    return rg.rgPath;
  } catch (error) {
    return null;
  }
}

export async function ensureRipgrepInstalled(): Promise<void> {
  await ensureStoragePath(context.globalStoragePath);

  if ((await getRipgrepExecutablePath()) !== null) {
    return;
  }

  await downloadVscodeRipgrep();

  await runVscodeRipgrepInstaller();
}
