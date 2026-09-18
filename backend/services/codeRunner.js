// Note: This service requires Node.js 18+ for the built-in fetch API.
// If using an older version, please install and use 'node-fetch' or 'axios'.
const SUPPORTED_LANGUAGES = ["python", "cpp", "c", "javascript"];

const FALLBACK_COMPILER_URL = "https://apexjudge-compiler-v3.onrender.com";
const PRIMARY_COMPILER_URL = process.env.COMPILER_SERVICE_URL || FALLBACK_COMPILER_URL;

const updateSupportedLanguages = async () => {
  for (const url of [PRIMARY_COMPILER_URL, FALLBACK_COMPILER_URL]) {
    try {
      const response = await fetch(`${url}/languages`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.languages) && data.languages.length > 0) {
          SUPPORTED_LANGUAGES.length = 0;
          SUPPORTED_LANGUAGES.push(...data.languages);
          return;
        }
      }
    } catch {
      // try next
    }
  }
};

// Initial fetch
updateSupportedLanguages();

const executeWithCompiler = async (baseUrl, { code, language, testCases, timeLimitMs }) => {
  const response = await fetch(`${baseUrl}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, testCases, timeLimitMs }),
    signal: AbortSignal.timeout((timeLimitMs || 2000) * 3 + 5000),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || `Compiler error: ${response.status}`);
    } catch (parseError) {
      if (parseError.message?.includes("Compiler error")) throw parseError;
      throw new Error(`Compiler error: ${response.status} - ${response.statusText}`);
    }
  }

  return await response.json();
};

const runCodeAgainstTestCases = async ({ code, language, testCases, timeLimitMs = 2000 }) => {
  try {
    return await executeWithCompiler(PRIMARY_COMPILER_URL, { code, language, testCases, timeLimitMs });
  } catch (primaryError) {
    // If primary failed due to network/refused and wasn't already fallback, try fallback compiler
    if (PRIMARY_COMPILER_URL !== FALLBACK_COMPILER_URL) {
      console.warn(`[codeRunner] Primary compiler ${PRIMARY_COMPILER_URL} failed (${primaryError.message}). Trying fallback ${FALLBACK_COMPILER_URL}...`);
      try {
        return await executeWithCompiler(FALLBACK_COMPILER_URL, { code, language, testCases, timeLimitMs });
      } catch (fallbackError) {
        console.error("[codeRunner] Fallback compiler also failed:", fallbackError.message);
      }
    }
    throw new Error(primaryError.message || "Code execution service unavailable. Please try again.");
  }
};

module.exports = {
  SUPPORTED_LANGUAGES,
  runCodeAgainstTestCases,
};
