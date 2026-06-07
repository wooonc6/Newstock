import { spawnSync } from "node:child_process";

const message = process.argv.slice(2).join(" ").trim() || "chore: update project";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpm(args) {
  if (process.platform === "win32") {
    run("cmd", ["/d", "/s", "/c", `npm ${args.join(" ")}`]);
  } else {
    run("npm", args);
  }
}

function output(command, args) {
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

const branch = output("git", ["branch", "--show-current"]);
if (branch !== "main") {
  console.error(`현재 브랜치가 main이 아닙니다: ${branch}`);
  console.error("먼저 main으로 이동한 뒤 다시 실행하세요: git switch main");
  process.exit(1);
}

console.log("1/5 origin/main 최신화");
run("git", ["pull", "--rebase", "--autostash", "origin", "main"]);

console.log("2/5 빌드 확인");
runNpm(["run", "build"]);

console.log("3/5 변경사항 스테이징");
run("git", ["add", "-A"]);

const staged = spawnSync("git", ["diff", "--cached", "--quiet"], {
  shell: false,
});

if (staged.status === 0) {
  console.log("커밋할 변경사항이 없습니다.");
  process.exit(0);
}

console.log(`4/5 커밋 생성: ${message}`);
run("git", ["commit", "-m", message]);

console.log("5/5 main에 push");
run("git", ["push", "origin", "main"]);

console.log("완료: Vercel 배포가 자동으로 시작됩니다.");
