const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const SUPPORTED_LANGUAGES = ["python", "cpp", "c", "javascript"];

const normalizeOutput = (value) =>
  (value ?? "")
    .toString()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trimEnd();

const compareOutput = (actual, expected) => normalizeOutput(actual) === normalizeOutput(expected);

const getExecutableName = () => (process.platform === "win32" ? "main.exe" : "main");

const getLanguageConfig = (language) => {
  const executable = getExecutableName();

  const configs = {
    python: {
      sourceFile: "main.py",
      compile: null,
      runCommand: process.platform === "win32" ? ["py", "-3", "main.py"] : ["python3", "main.py"],
      fallbackRunCommands: [["python", "main.py"], ["py", "main.py"]],
    },
    javascript: {
      sourceFile: "main.js",
      compile: null,
      runCommand: ["node", "main.js"],
      fallbackRunCommands: [],
    },
    cpp: {
      sourceFile: "main.cpp",
      compile: ["g++", "-O2", "-std=c++17", "main.cpp", "-o", executable],
      runCommand: process.platform === "win32" ? [executable] : ["./main"],
      fallbackRunCommands: [],
    },
    c: {
      sourceFile: "main.c",
      compile: ["gcc", "-O2", "main.c", "-o", executable],
      runCommand: process.platform === "win32" ? [executable] : ["./main"],
      fallbackRunCommands: [],
    },
  };

  return configs[language] || null;
};

const runCommand = ({ command, args, cwd, input = "", timeLimitMs }) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeLimitMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr || error.message,
        exitCode: 1,
        timedOut: false,
        spawnError: true,
      });
    });

    if (input) {
      child.stdin.write(input);
    }

    child.stdin.end();

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 1,
        timedOut,
        spawnError: false,
      });
    });
  });

const tryRunCommands = async (commands, options) => {
  let lastResult = null;

  for (const args of commands) {
    const [command, ...commandArgs] = args;
    const result = await runCommand({ command, args: commandArgs, ...options });

    if (!result.spawnError) {
      return result;
    }

    lastResult = result;
  }

  return lastResult;
};

const compileSource = async (config, workDir, timeLimitMs) => {
  if (!config.compile) {
    return { ok: true };
  }

  const [command, ...args] = config.compile;
  const result = await runCommand({
    command,
    args,
    cwd: workDir,
    input: "",
    timeLimitMs: Math.max(timeLimitMs, 5000),
  });

  if (result.timedOut) {
    return { ok: false, verdict: "Time Limit Exceeded", stderr: result.stderr, stdout: result.stdout };
  }

  if (result.exitCode !== 0) {
    return {
      ok: false,
      verdict: "Compilation Error",
      stderr: result.stderr || result.stdout || "Compilation failed.",
      stdout: result.stdout,
    };
  }

  return { ok: true };
};

const executeTestCase = async ({ config, workDir, input, timeLimitMs }) => {
  const runCommands = [config.runCommand, ...config.fallbackRunCommands];
  const result = await tryRunCommands(runCommands, {
    cwd: workDir,
    input,
    timeLimitMs,
  });

  if (!result) {
    return {
      stdout: "",
      stderr: "Unable to start code runner.",
      exitCode: 1,
      verdict: "Runtime Error",
    };
  }

  if (result.timedOut) {
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      verdict: "Time Limit Exceeded",
    };
  }

  if (result.spawnError) {
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      verdict: "Runtime Error",
    };
  }

  if (result.exitCode !== 0) {
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      verdict: "Runtime Error",
    };
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    verdict: null,
  };
};

const runCodeAgainstTestCases = async ({ code, language, testCases, timeLimitMs = 2000 }) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error("Unsupported language.");
  }

  if (!code || !code.trim()) {
    throw new Error("Code cannot be empty.");
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error("No test cases available for this question.");
  }

  const config = getLanguageConfig(language);

  if (!config) {
    throw new Error("Unsupported language.");
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "oj-run-"));
  const sourcePath = path.join(workDir, config.sourceFile);

  try {
    await fs.writeFile(sourcePath, code, "utf8");

    const compileResult = await compileSource(config, workDir, timeLimitMs);

    if (!compileResult.ok) {
      return {
        results: testCases.map((testCase, index) => ({
          id: index + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "",
          stderr: compileResult.stderr || "",
          stdout: compileResult.stdout || "",
          verdict: compileResult.verdict,
        })),
        terminalOutput: compileResult.stderr || compileResult.stdout || "Compilation failed.",
      };
    }

    const results = [];
    const terminalLines = [];

    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      const execution = await executeTestCase({
        config,
        workDir,
        input: testCase.input ?? "",
        timeLimitMs,
      });

      let verdict = execution.verdict;

      if (!verdict) {
        verdict = compareOutput(execution.stdout, testCase.expectedOutput) ? "Accepted" : "Wrong Answer";
      }

      const caseLabel = `Case ${index + 1}`;
      terminalLines.push(`=== ${caseLabel} ===`);

      if (testCase.input) {
        terminalLines.push(`Input:\n${testCase.input}`);
      }

      if (execution.stdout) {
        terminalLines.push(`Output:\n${normalizeOutput(execution.stdout)}`);
      } else {
        terminalLines.push("Output:\n(no stdout)");
      }

      if (execution.stderr) {
        terminalLines.push(`Stderr:\n${execution.stderr.trimEnd()}`);
      }

      terminalLines.push(`Verdict: ${verdict}\n`);

      results.push({
        id: index + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: normalizeOutput(execution.stdout),
        stderr: execution.stderr,
        stdout: execution.stdout,
        verdict,
      });
    }

    return {
      results,
      terminalOutput: terminalLines.join("\n"),
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

module.exports = {
  SUPPORTED_LANGUAGES,
  runCodeAgainstTestCases,
};
