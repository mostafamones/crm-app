import { request } from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = "127.0.0.1";
const origin = `http://localhost:${port}`;
const nextBinary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);

let hasOpenedBrowser = false;
let isShuttingDown = false;

if (!fs.existsSync(nextBinary)) {
  console.error(
    `[showcase] Could not find Next.js at ${nextBinary}. Run "npm install" before using "npm run showcase".`,
  );
  process.exit(1);
}

const devServer = spawn(nextBinary, ["dev", "--hostname", host, "--port", String(port)], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

function cleanup(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (!devServer.killed) {
    devServer.kill("SIGINT");
  }

  process.exit(exitCode);
}

function isSuccessStatus(statusCode) {
  return typeof statusCode === "number" && statusCode >= 200 && statusCode < 500;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function probeServer() {
  return new Promise((resolve) => {
    const req = request(
      {
        host,
        port,
        path: "/",
        method: "GET",
        timeout: 1_000,
      },
      (res) => {
        res.resume();
        resolve(isSuccessStatus(res.statusCode));
      },
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (devServer.exitCode !== null) {
      return false;
    }

    if (await probeServer()) {
      return true;
    }

    await wait(500);
  }

  return false;
}

function openBrowser(url) {
  if (process.env.SHOWCASE_NO_OPEN === "1") {
    console.log(`[showcase] Browser auto-open skipped for ${url}`);
    return;
  }

  if (process.platform === "darwin") {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    return;
  }

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
    return;
  }

  spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
}

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));

devServer.on("exit", (code) => {
  if (isShuttingDown) {
    return;
  }

  process.exit(code ?? 0);
});

devServer.on("error", (error) => {
  console.error("[showcase] Failed to start the Next.js dev server:", error.message);
  cleanup(1);
});

waitForServer()
  .then((isReady) => {
    if (!isReady || hasOpenedBrowser) {
      return;
    }

    hasOpenedBrowser = true;
    console.log(`[showcase] Opening ${origin}`);
    openBrowser(origin);
  })
  .catch((error) => {
    console.error("[showcase] Failed to launch showcase mode:", error);
    cleanup(1);
  });
