import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const cwd = process.cwd();
const require = createRequire(import.meta.url);

const normalizeBasePath = (value) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  return `/${trimmed.replace(/^\/+/, "").replace(/\/+$/, "")}`;
};

const getFilesByExtension = (directory, extension) => {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return getFilesByExtension(fullPath, extension);
    }

    return fullPath.endsWith(extension) ? [fullPath] : [];
  });
};

const replaceFunctionDefaultArgument = (bundleContent, exportName, basePathValue) => {
  const exportPattern = new RegExp(`e\\.${exportName}=([A-Za-z$_][\\w$]*)(?=[,;}])`);
  const exportMatch = exportPattern.exec(bundleContent);

  if (!exportMatch) {
    return bundleContent;
  }

  const functionName = exportMatch[1];
  const searchStart = Math.max(0, exportMatch.index - 5000);
  const prelude = bundleContent.slice(searchStart, exportMatch.index);
  const functionPattern = new RegExp(`function ${functionName}\\(([^,]+),([^=]+)=\"\"\\)\\{`);
  const functionMatch = functionPattern.exec(prelude);

  if (!functionMatch) {
    return bundleContent;
  }

  const absoluteIndex = searchStart + functionMatch.index;
  const replacement = `function ${functionName}(${functionMatch[1]},${functionMatch[2]}=${JSON.stringify(basePathValue)}){`;

  return (
    bundleContent.slice(0, absoluteIndex) +
    replacement +
    bundleContent.slice(absoluteIndex + functionMatch[0].length)
  );
};

const rewriteHtmlForBasePath = (filePath, basePathValue) => {
  let html = readFileSync(filePath, "utf8").replace(/\\/g, "/");

  if (basePathValue) {
    const normalizedPrefix = basePathValue.replace(/^\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rootAssetPattern = new RegExp(`(href|src)="/(?!${normalizedPrefix}/|/)`, "g");
    html = html.replace(rootAssetPattern, `$1="${basePathValue}/`);
  }

  writeFileSync(filePath, html);
};

const rewriteJavaScriptForBasePath = (filePath, basePathValue) => {
  if (!basePathValue) {
    return;
  }

  let bundle = readFileSync(filePath, "utf8");

  bundle = replaceFunctionDefaultArgument(bundle, "appendBaseUrl", basePathValue);
  bundle = replaceFunctionDefaultArgument(bundle, "stripBaseUrl", basePathValue);
  bundle = bundle.replace(/httpServerLocation:"\/assets/g, `httpServerLocation:"${basePathValue}/assets`);

  writeFileSync(filePath, bundle);
};

const inferRepositoryBasePath = () => {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    return "";
  }

  const repoName = repository.split("/")[1] ?? "";

  if (!repoName || repoName.endsWith(".github.io")) {
    return "";
  }

  return `/${repoName}`;
};

const basePath = normalizeBasePath(
  process.env.GITHUB_PAGES_BASE_PATH ?? process.env.EXPO_BASE_URL ?? inferRepositoryBasePath()
);

const env = {
  ...process.env,
  EXPO_BASE_URL: basePath
};

const expoCliPath = require.resolve("expo/bin/cli");
const command = process.execPath;
const args = [expoCliPath, "export", "-p", "web", "--output-dir", "dist"];

console.log(
  basePath
    ? `Exporting the frontend for GitHub Pages with base path "${basePath}".`
    : "Exporting the frontend for GitHub Pages at the site root."
);

const result = spawnSync(command, args, {
  cwd,
  env,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const distDir = path.join(cwd, "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const notFoundPath = path.join(distDir, "404.html");
const noJekyllPath = path.join(distDir, ".nojekyll");
const cnamePath = path.join(distDir, "CNAME");

if (!existsSync(indexHtmlPath)) {
  console.error("The export finished without generating dist/index.html.");
  process.exit(1);
}

for (const jsFilePath of getFilesByExtension(path.join(distDir, "_expo", "static", "js"), ".js")) {
  rewriteJavaScriptForBasePath(jsFilePath, basePath);
}

rewriteHtmlForBasePath(indexHtmlPath, basePath);
copyFileSync(indexHtmlPath, notFoundPath);
writeFileSync(noJekyllPath, "");

const cname = process.env.GITHUB_PAGES_CNAME?.trim();

if (cname) {
  writeFileSync(cnamePath, `${cname}\n`);
}
