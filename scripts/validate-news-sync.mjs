import fs from "node:fs";
import ts from "typescript";

const appStocksPath = "src/lib/stocks.ts";
const syncFunctionPath = "supabase/functions/news-sync/index.ts";
const tickerPattern = /ticker:\s*"([0-9]{6}\.KS)"/g;

function readTickers(source) {
  return new Set(Array.from(source.matchAll(tickerPattern), (match) => match[1]));
}

const appStocksSource = fs.readFileSync(appStocksPath, "utf8");
const syncFunctionSource = fs.readFileSync(syncFunctionPath, "utf8");
const appTickers = readTickers(appStocksSource);
const syncTickers = readTickers(syncFunctionSource);

const missingInSync = [...appTickers].filter((ticker) => !syncTickers.has(ticker));
const extraInSync = [...syncTickers].filter((ticker) => !appTickers.has(ticker));

if (missingInSync.length > 0 || extraInSync.length > 0) {
  console.error("종목 목록이 일치하지 않습니다.", { missingInSync, extraInSync });
  process.exit(1);
}

const transpiled = ts.transpileModule(syncFunctionSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    strict: true,
  },
  fileName: syncFunctionPath,
  reportDiagnostics: true,
});

const syntaxErrors = (transpiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);

if (syntaxErrors.length > 0) {
  for (const diagnostic of syntaxErrors) {
    console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  }
  process.exit(1);
}

if (appTickers.size !== 30) {
  console.error(`예상 종목 수는 30개지만 ${appTickers.size}개가 확인됐습니다.`);
  process.exit(1);
}

console.log(`뉴스 자동 수집 종목 ${appTickers.size}개와 Edge Function 문법을 확인했습니다.`);
