// ─── Language options ──────────────────────────────────────────────────────
export const LANG_OPTIONS = [
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

export const LANG_STARTERS = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your solution\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Your solution\n    return 0;\n}`,
  python: `import sys\n\n# Your solution here\n`,
  javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\n\n// Your solution here\n`,
};

// ─── Category info descriptions (for the ℹ️ modal) ────────────────────────
export const CATEGORY_INFO = {
  "Blind Judge": {
    title: "👁 Blind Judge",
    description: "In this challenge, all test cases are hidden from you. When you run your code, you'll only see ✓ (Correct) or ✗ (Incorrect) — no expected output, no diff. You must trust your logic and debug with your mind alone.",
    whatToDo: "Write a complete solution. Click Run to test against hidden cases. You only see pass/fail — no details. Submit when confident.",
  },
  "Debug the Code": {
    title: "🐛 Debug the Code",
    description: "You're given a piece of code that is supposed to solve a problem but contains bugs. The code compiles/runs but produces wrong output. Your mission is to find and fix all bugs.",
    whatToDo: "Read the problem statement, examine the buggy code, identify all bugs, fix them, and submit the corrected version.",
  },
  "Overflow Trap": {
    title: "💥 Overflow Trap",
    description: "These problems look deceptively easy, but the input values are so large they can't even be handled by long long! The naive approach will overflow. You need to think about data types and mathematical tricks.",
    whatToDo: "The starter code gives WRONG answers due to overflow. Fix the approach to handle astronomically large numbers without overflow.",
  },
  "Precision Trap": {
    title: "🎯 Precision Trap",
    description: "Problems that trick you into using floating point arithmetic when an exact integer solution exists. Naive float calculations will give wrong answers due to precision loss.",
    whatToDo: "Find the mathematical insight that avoids floating point entirely. The starter code uses floats and gets wrong answers — fix it.",
  },
  "Fix the Performance": {
    title: "⚡ TLE Fix",
    description: "The code is logically correct but too slow — it will Time Limit Exceed (TLE) on large inputs. You need to optimize the algorithm's time complexity.",
    whatToDo: "Identify the bottleneck in the provided code and optimize it. The code works correctly on small inputs but TLEs on large ones.",
  },
  "Memory Overflow": {
    title: "🧠 Memory Overflow",
    description: "The code solves the problem correctly but uses too much memory (MLE). You need to optimize space usage — often by reducing a 2D structure to 1D.",
    whatToDo: "Reduce the memory footprint of the solution without changing the correct output. Optimize from O(N²) to O(N) space.",
  },
  "Fill the Missing Part": {
    title: "🧩 Fill In",
    description: "You're given an incomplete implementation of a well-known algorithm. Key functions are left as TODO stubs. You must fill them in correctly.",
    whatToDo: "Read the algorithm structure, understand what each TODO function should do, and implement them. The framework is there — you complete the core logic.",
  },
  "Predict the Output": {
    title: "🔮 Predict",
    description: "You're shown a piece of code with no inputs needed. Study it carefully and predict the exact output without running it. Tests your ability to trace code mentally.",
    whatToDo: "Read the code line by line, trace through the logic mentally, and type the exact output. No coding needed — just analysis.",
  },
  "Choose the Approach": {
    title: "🎲 Strategy",
    description: "Given a problem with constraints, you need to choose the right algorithmic approach from multiple options. Tests your ability to analyze time/space complexity trade-offs.",
    whatToDo: "Read the problem and constraints carefully. Select the approach(es) that will work within the given limits. Answer the strategy questions.",
  },
  "Interactive Logic": {
    title: "💬 Interactive",
    description: "A game where you interact with a hidden system. You can ask yes/no queries to narrow down the answer. Uses binary search thinking to find a hidden value efficiently.",
    whatToDo: "Ask strategic queries (yes/no) to narrow the search range. Use binary search logic. After your queries, make your final guess.",
  },
};

// ─── Challenge bank: 1 carefully designed question per category (ninja stories) ─
export const CHALLENGES = [
  // 0. BLIND JUDGE — no test cases shown
  {
    id: "blind_judge",
    category: "Blind Judge",
    categoryShort: "BLIND",
    icon: "👁",
    color: "#9b59b6",
    description: `**The Scrolls of the Rising Path**\n\nMaster Kaze has hidden ancient scrolls along a mountain trail. Each scroll bears a power value. You must find the **longest sequence of scrolls** you can collect while walking uphill — each scroll must have **strictly greater power** than the previous one you picked.\n\nThe scrolls cannot be rearranged — you must pick them in the order they appear on the trail.\n\n**Input:**\nLine 1: N — number of scrolls (1 ≤ N ≤ 1000)\nLine 2: N space-separated integers — power of each scroll (−10⁶ ≤ a\u1d62 ≤ 10⁶)\n\n**Output:** A single integer — the longest strictly increasing subsequence length.\n\n**Constraints:**\n• 1 ≤ N ≤ 1000\n• −10⁶ ≤ a\u1d62 ≤ 10⁶\n\n*Your eyes are sealed. The Dojo only reveals \u2713 or \u2717.*`,
    starterCode: LANG_STARTERS,
    uiType: "blind",
    hint: "Think patience sorting or classic DP. dp[i] = longest increasing subsequence ending at index i.",
  },

  // 1. DEBUG THE CODE — buggy medium code
  {
    id: "debug_code",
    category: "Debug the Code",
    categoryShort: "DEBUG",
    icon: "\ud83d\udc1b",
    color: "#e74c3c",
    description: `**The Broken Village Map**\n\nThe Shadow Village has been split into isolated districts after an earthquake. Messenger Ninja Rei wrote code to count the **number of disconnected districts** using BFS traversal of the village map.\n\nBut Rei's code has **3 bugs** — the village elders report wrong district counts! Find and fix all 3 bugs before the enemy discovers the vulnerable districts.\n\n**Input:**\nLine 1: N M — N districts (nodes), M roads (edges)\nNext M lines: u v — road connecting district u and v (1-indexed, bidirectional)\n\n**Output:** Number of disconnected districts (connected components).\n\n**Constraints:**\n• 1 ≤ N ≤ 1000, 0 ≤ M ≤ N\u00d7(N\u22121)/2\n• 1 ≤ u, v ≤ N`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n, m;\n    cin >> n >> m;\n    \n    vector<vector<int>> adj(n); // Bug 1: should be n+1 for 1-indexed\n    for (int i = 0; i < m; i++) {\n        int u, v;\n        cin >> u >> v;\n        adj[u].push_back(v);\n        // Bug 2: missing reverse edge adj[v].push_back(u)\n    }\n    \n    vector<bool> visited(n, false); // Bug 3: should be n+1\n    int components = 0;\n    \n    for (int i = 1; i <= n; i++) {\n        if (!visited[i]) {\n            components++;\n            queue<int> q;\n            q.push(i);\n            visited[i] = true;\n            while (!q.empty()) {\n                int node = q.front(); q.pop();\n                for (int nb : adj[node]) {\n                    if (!visited[nb]) {\n                        visited[nb] = true;\n                        q.push(nb);\n                    }\n                }\n            }\n        }\n    }\n    cout << components << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\n#define MAXN 1005\nint adj[MAXN][MAXN], visited[MAXN], n, m;\n\nvoid bfs(int start) {\n    int queue[MAXN], front = 0, back = 0;\n    queue[back++] = start;\n    visited[start] = 1;\n    while (front < back) {\n        int node = queue[front++];\n        for (int i = 1; i <= n; i++) {\n            if (adj[node][i] && !visited[i]) {\n                visited[i] = 1;\n                queue[back++] = i;\n            }\n        }\n    }\n}\n\nint main() {\n    scanf("%d %d", &n, &m);\n    for (int i = 0; i < m; i++) {\n        int u, v;\n        scanf("%d %d", &u, &v);\n        adj[u][v] = 1;\n        // Bug: missing adj[v][u] = 1\n    }\n    memset(visited, 0, sizeof(visited));\n    int components = 0;\n    for (int i = 1; i <= n; i++) {\n        if (!visited[i]) {\n            components++;\n            bfs(i);\n        }\n    }\n    printf("%d\\n", components);\n    return 0;\n}`,
      python: `import sys\nfrom collections import deque\n\ndef main():\n    input_data = sys.stdin.read().split()\n    idx = 0\n    n, m = int(input_data[idx]), int(input_data[idx+1])\n    idx += 2\n    \n    adj = [[] for _ in range(n)]  # Bug 1: should be n+1\n    for _ in range(m):\n        u, v = int(input_data[idx]), int(input_data[idx+1])\n        idx += 2\n        adj[u].append(v)\n        # Bug 2: missing adj[v].append(u)\n    \n    visited = [False] * (n)  # Bug 3: should be n+1\n    components = 0\n    \n    for i in range(1, n + 1):\n        if not visited[i]:\n            components += 1\n            q = deque([i])\n            visited[i] = True\n            while q:\n                node = q.popleft()\n                for nb in adj[node]:\n                    if not visited[nb]:\n                        visited[nb] = True\n                        q.append(nb)\n    \n    print(components)\n\nmain()`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\nlet idx = 0;\nconst [n, m] = lines[idx++].split(" ").map(Number);\n\nconst adj = Array.from({length: n}, () => []); // Bug 1: should be n+1\nfor (let i = 0; i < m; i++) {\n    const [u, v] = lines[idx++].split(" ").map(Number);\n    adj[u].push(v);\n    // Bug 2: missing adj[v].push(u)\n}\n\nconst visited = new Array(n).fill(false); // Bug 3: should be n+1\nlet components = 0;\n\nfor (let i = 1; i <= n; i++) {\n    if (!visited[i]) {\n        components++;\n        const queue = [i];\n        visited[i] = true;\n        let front = 0;\n        while (front < queue.length) {\n            const node = queue[front++];\n            for (const nb of adj[node]) {\n                if (!visited[nb]) {\n                    visited[nb] = true;\n                    queue.push(nb);\n                }\n            }\n        }\n    }\n}\n\nconsole.log(components);`,
    },
    uiType: "debug",
    hint: "Look at array sizes (1-indexed vs 0-indexed) and bidirectional edges.",
  },

  // 2. OVERFLOW TRAP — inputs too large for long long
  {
    id: "overflow_trap",
    category: "Overflow Trap",
    categoryShort: "OVERFLOW",
    icon: "\ud83d\udca5",
    color: "#e67e22",
    description: `**The Treasure of Infinite Coins**\n\nThe Shadow Clan's vault contains N golden coins, numbered 1 through N. The Grand Master asks: *What is the total value of all coins combined?*\n\nSimple? The catch: N can be astronomically large — up to **10\u00b9\u2078** (a quintillion). Even \`long long\` can hold N itself, but **N \u00d7 (N+1)** overflows every fixed-size integer type.\n\n**Input:** A single integer N (1 \u2264 N \u2264 10\u00b9\u2078)\n\n**Output:** The sum 1 + 2 + ... + N.\n\n**Constraints:**\n• 1 \u2264 N \u2264 10\u00b9\u2078\n• The answer can exceed 10\u00b3\u2076 — no primitive type can hold it!\n\n*The starter code computes the formula but overflows. Fix it.*`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    // This overflows! n*(n+1) exceeds long long for n~10^18\n    long long result = n * (n + 1) / 2;\n    cout << result << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n\nint main() {\n    long long n;\n    scanf("%lld", &n);\n    // This overflows! n*(n+1) exceeds long long range\n    long long result = n * (n + 1) / 2;\n    printf("%lld\\n", result);\n    return 0;\n}`,
      python: `n = int(input())\n# This works in Python (arbitrary precision) but think:\n# Can you make it work in C/C++ too?\n# Hint: you can't use long long for n*(n+1) when n=10^18\nresult = n * (n + 1) // 2\nprint(result)`,
      javascript: `const n = BigInt(require("fs").readFileSync(0,"utf8").trim());\n// BigInt handles this, but in C/C++ this overflows!\nconst result = n * (n + 1n) / 2n;\nconsole.log(result.toString());`,
    },
    uiType: "blind",
    hint: "N*(N+1) overflows long long when N\u224810\u00b9\u2078. In C/C++, you need __int128, or use Python/JS BigInt. Alternatively: if N is even, compute (N/2)*(N+1); if odd, compute N*((N+1)/2).",
  },

  // 3. PRECISION TRAP
  {
    id: "precision_trap",
    category: "Precision Trap",
    categoryShort: "PRECISION",
    icon: "\ud83c\udfaf",
    color: "#3498db",
    description: `**The Inscribed Training Ground**\n\nMaster Hiro is building a square training ground inside a circular arena. The arena has radius R. The square must be the **largest possible** that fits perfectly inside the circle (inscribed).\n\nHiro's apprentice wrote code using \`sqrt()\` and \`M_PI\` — but the answers come out wrong for large R values due to floating-point precision loss.\n\nFind the **exact area** of the inscribed square.\n\n**Input:** A single integer R (1 \u2264 R \u2264 10\u2079)\n\n**Output:** Print the area with **exactly 6 decimal places**.\n\n**Constraints:**\n• 1 \u2264 R \u2264 10\u2079\n\n*The starter code uses floating point and gets wrong answers. Find the exact formula.*`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long r;\n    cin >> r;\n    // WRONG: floating point precision loss for large R\n    double side = r * sqrt(2.0);\n    double area = side * side;\n    printf("%.6f\\n", area);\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <math.h>\n\nint main() {\n    long long r;\n    scanf("%lld", &r);\n    // WRONG: floating point precision loss\n    double side = r * sqrt(2.0);\n    double area = side * side;\n    printf("%.6f\\n", area);\n    return 0;\n}`,
      python: `import math\nr = int(input())\n# WRONG: floating point precision loss for large R\nside = r * math.sqrt(2)\narea = side * side\nprint(f"{area:.6f}")`,
      javascript: `const r = BigInt(require("fs").readFileSync(0,"utf8").trim());\n// WRONG approach using floats:\nconst side = Number(r) * Math.sqrt(2);\nconst area = side * side;\nconsole.log(area.toFixed(6));`,
    },
    uiType: "blind",
    hint: "Area = 2R\u00b2. No floating point needed! The diagonal of the inscribed square = diameter = 2R, so side = 2R/\u221a2, area = side\u00b2 = 2R\u00b2. Just output 2*R*R with .000000.",
  },

  // 4. FIX THE PERFORMANCE
  {
    id: "fix_performance",
    category: "Fix the Performance",
    categoryShort: "TLE FIX",
    icon: "\u26a1",
    color: "#f39c12",
    description: `**The Clan's Prime Cipher**\n\nThe Shadow Clan uses prime numbers as cipher keys. Guard Ninja Takeshi wrote a primality checker to validate keys, but it's **too slow** — enemy messages pile up while Takeshi's code crawls through each number up to N.\n\nThe code is **logically correct** but uses O(N) time per check. Fix it to handle keys up to **10\u00b9\u00b2** within the time limit.\n\n**Input:**\nLine 1: T — number of keys to validate (T \u2264 1000)\nNext T lines: one integer N each (1 \u2264 N \u2264 10\u00b9\u00b2)\n\n**Output:** For each N: "YES" if prime, "NO" otherwise.\n\n**Constraints:**\n• 1 \u2264 T \u2264 1000\n• 1 \u2264 N \u2264 10\u00b9\u00b2`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool isPrime(long long n) {\n    if (n < 2) return false;\n    // This is O(N) — too slow for n up to 10^12\n    for (long long i = 2; i < n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n\nint main() {\n    int t;\n    cin >> t;\n    while (t--) {\n        long long n;\n        cin >> n;\n        cout << (isPrime(n) ? "YES" : "NO") << "\\n";\n    }\n    return 0;\n}`,
      python: `import sys\ninput = sys.stdin.readline\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    # O(N) — too slow!\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True\n\nt = int(input())\nfor _ in range(t):\n    n = int(input())\n    print("YES" if is_prime(n) else "NO")`,
      c: `#include <stdio.h>\n\nint isPrime(long long n) {\n    if (n < 2) return 0;\n    // O(N) — too slow\n    for (long long i = 2; i < n; i++) {\n        if (n % i == 0) return 0;\n    }\n    return 1;\n}\n\nint main() {\n    int t;\n    scanf("%d", &t);\n    while (t--) {\n        long long n;\n        scanf("%lld", &n);\n        printf("%s\\n", isPrime(n) ? "YES" : "NO");\n    }\n    return 0;\n}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\nlet idx = 0;\nconst t = parseInt(lines[idx++]);\n\nfunction isPrime(n) {\n    if (n < 2n) return false;\n    // O(N) — too slow!\n    for (let i = 2n; i < n; i++) {\n        if (n % i === 0n) return false;\n    }\n    return true;\n}\n\nfor (let i = 0; i < t; i++) {\n    const n = BigInt(lines[idx++].trim());\n    console.log(isPrime(n) ? "YES" : "NO");\n}`,
    },
    uiType: "debug",
    hint: "Check only up to \u221aN. Change `i < n` to `i * i <= n`. That's O(\u221aN) — fast enough for 10\u00b9\u00b2.",
  },

  // 5. MEMORY OVERFLOW
  {
    id: "memory_overflow",
    category: "Memory Overflow",
    categoryShort: "MEMORY",
    icon: "\ud83e\udde0",
    color: "#1abc9c",
    description: `**The Lightest Path Through the Forest**\n\nNinja scout Yuki must cross an N\u00d7M grid forest from the top-left corner to the bottom-right, moving only **right** or **down**. Each cell has a danger value. Yuki must find the path with **minimum total danger**.\n\nThe Clan's old code works correctly but uses O(N\u00d7M) memory for the DP table — it crashes (MLE) for large forests.\n\n**Fix it to use only O(M) memory.**\n\n**Input:**\nLine 1: N M — grid dimensions (1 \u2264 N, M \u2264 1000)\nNext N lines: M integers each — danger values (0 \u2264 value \u2264 100)\n\n**Output:** Minimum total danger along the path.\n\n**Constraints:**\n• 1 \u2264 N, M \u2264 1000\n• 0 \u2264 cell value \u2264 100`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n, m;\n    cin >> n >> m;\n    \n    // O(N*M) memory — too much for large grids\n    vector<vector<int>> grid(n, vector<int>(m));\n    vector<vector<long long>> dp(n, vector<long long>(m, 0));\n    \n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < m; j++)\n            cin >> grid[i][j];\n    \n    dp[0][0] = grid[0][0];\n    for (int j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];\n    for (int i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];\n    \n    for (int i = 1; i < n; i++)\n        for (int j = 1; j < m; j++)\n            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j];\n    \n    cout << dp[n-1][m-1] << "\\n";\n    return 0;\n}`,
      python: `import sys\ninput = sys.stdin.readline\n\ndef main():\n    n, m = map(int, input().split())\n    grid = []\n    for _ in range(n):\n        grid.append(list(map(int, input().split())))\n    \n    # O(N*M) memory — refactor to O(M)\n    dp = [[0]*m for _ in range(n)]\n    dp[0][0] = grid[0][0]\n    for j in range(1, m): dp[0][j] = dp[0][j-1] + grid[0][j]\n    for i in range(1, n): dp[i][0] = dp[i-1][0] + grid[i][0]\n    \n    for i in range(1, n):\n        for j in range(1, m):\n            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]\n    \n    print(dp[n-1][m-1])\n\nmain()`,
      c: `#include <stdio.h>\n#define MAXN 1005\n\n// O(N*M) memory\nlong long dp[MAXN][MAXN];\nint grid[MAXN][MAXN];\n\nint main() {\n    int n, m;\n    scanf("%d %d", &n, &m);\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < m; j++)\n            scanf("%d", &grid[i][j]);\n    \n    dp[0][0] = grid[0][0];\n    for (int j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];\n    for (int i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];\n    \n    for (int i = 1; i < n; i++)\n        for (int j = 1; j < m; j++)\n            dp[i][j] = (dp[i-1][j] < dp[i][j-1] ? dp[i-1][j] : dp[i][j-1]) + grid[i][j];\n    \n    printf("%lld\\n", dp[n-1][m-1]);\n    return 0;\n}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\nlet idx = 0;\nconst [n, m] = lines[idx++].split(" ").map(Number);\n\n// O(N*M) memory\nconst grid = [];\nfor (let i = 0; i < n; i++) grid.push(lines[idx++].split(" ").map(Number));\n\nconst dp = Array.from({length: n}, () => new Array(m).fill(0));\ndp[0][0] = grid[0][0];\nfor (let j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];\nfor (let i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];\n\nfor (let i = 1; i < n; i++)\n    for (let j = 1; j < m; j++)\n        dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1]) + grid[i][j];\n\nconsole.log(dp[n-1][m-1]);`,
    },
    uiType: "debug",
    hint: "You only need the previous row. Use a 1D dp array and update in-place.",
  },

  // 6. FILL THE MISSING PART
  {
    id: "fill_missing",
    category: "Fill the Missing Part",
    categoryShort: "FILL IN",
    icon: "\ud83e\udde9",
    color: "#8e44ad",
    description: `**The Rank of the Warrior**\n\nIn the Shadow Clan's tournament, each warrior has a power score. The Grand Master needs to quickly find the warrior ranked K-th weakest (the K-th smallest power) **without sorting the entire roster** — a full sort would alert enemy spies monitoring computation patterns.\n\nComplete the **Quickselect algorithm** — fill in the \`partition\` and \`quickSelect\` functions.\n\n**Input:**\nLine 1: N K — number of warriors and desired rank\nLine 2: N integers — power scores\n\n**Output:** The K-th smallest power value (1-indexed).\n\n**Constraints:**\n• 1 \u2264 K \u2264 N \u2264 10\u2075\n• \u221210\u2079 \u2264 power \u2264 10\u2079`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n// TODO: Implement the partition function (Lomuto or Hoare scheme)\n// Returns the final index of the pivot\nint partition(vector<int>& arr, int left, int right) {\n    // YOUR CODE HERE\n}\n\n// TODO: Implement quickSelect\n// Returns the k-th smallest element (0-indexed k)\nint quickSelect(vector<int>& arr, int left, int right, int k) {\n    // YOUR CODE HERE\n}\n\nint main() {\n    int n, k;\n    cin >> n >> k;\n    vector<int> arr(n);\n    for (int& x : arr) cin >> x;\n    cout << quickSelect(arr, 0, n - 1, k - 1) << "\\n";\n    return 0;\n}`,
      python: `import sys\ninput = sys.stdin.readline\n\n# TODO: Implement partition (Lomuto scheme)\n# Partitions arr[left..right] around arr[right] as pivot\n# Returns final pivot index\ndef partition(arr, left, right):\n    # YOUR CODE HERE\n    pass\n\n# TODO: Implement quickSelect\n# Returns the k-th smallest element (0-indexed k)\ndef quick_select(arr, left, right, k):\n    # YOUR CODE HERE\n    pass\n\ndef main():\n    n, k = map(int, input().split())\n    arr = list(map(int, input().split()))\n    print(quick_select(arr, 0, n - 1, k - 1))\n\nmain()`,
      c: `#include <stdio.h>\n\nvoid swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }\n\n// TODO: Implement partition\nint partition(int* arr, int left, int right) {\n    // YOUR CODE HERE\n}\n\n// TODO: Implement quickSelect\nint quickSelect(int* arr, int left, int right, int k) {\n    // YOUR CODE HERE\n}\n\nint main() {\n    int n, k;\n    scanf("%d %d", &n, &k);\n    int arr[100005];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    printf("%d\\n", quickSelect(arr, 0, n - 1, k - 1));\n    return 0;\n}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\nconst [n, k] = lines[0].split(" ").map(Number);\nconst arr = lines[1].split(" ").map(Number);\n\n// TODO: Implement partition (Lomuto scheme)\nfunction partition(arr, left, right) {\n    // YOUR CODE HERE\n}\n\n// TODO: Implement quickSelect  \nfunction quickSelect(arr, left, right, k) {\n    // YOUR CODE HERE\n}\n\nconsole.log(quickSelect(arr, 0, n - 1, k - 1));`,
    },
    uiType: "debug",
    hint: "Lomuto partition: pick arr[right] as pivot. Place smaller elements to the left. Return the pivot's final position.",
  },

  // 7. PREDICT THE OUTPUT
  {
    id: "predict_output",
    category: "Predict the Output",
    categoryShort: "PREDICT",
    icon: "\ud83d\udd2e",
    color: "#2ecc71",
    description: `**The Cipher Scroll**\n\nIntercepted from an enemy messenger — this code fragment was used to encode a secret signal. The enemy ran this code and transmitted the output as a coded message.\n\nStudy the code carefully and predict **exactly** what it prints (two lines of output).\n\n\`\`\`cpp\n#include <bits/stdc++.h>\nusing namespace std;\n\nint f(int n, vector<int>& memo) {\n    if (n <= 1) return n;\n    if (memo[n] != -1) return memo[n];\n    return memo[n] = f(n-1, memo) + f(n-2, memo);\n}\n\nint main() {\n    int n = 10;\n    vector<int> memo(n+1, -1);\n    for (int i = 0; i <= n; i++) {\n        cout << f(i, memo);\n        if (i < n) cout << " ";\n    }\n    cout << endl;\n    \n    // What does this print?\n    int x = 1;\n    for (int i = 0; i < 5; i++) {\n        x = x << i;\n        cout << x << " ";\n    }\n    cout << endl;\n    return 0;\n}\n\`\`\`\n\nType the **exact output** (two lines) in the answer box below.`,
    starterCode: null, // No editor — text input only
    uiType: "predict",
    hint: "First line: Fibonacci sequence (0 through F(10)). Second line: bit-shifting — trace carefully: x starts at 1, then x<<=0\u21921, x<<=1\u21922, x<<=2\u21928, x<<=3\u219264, x<<=4\u21921024.",
    expectedOutput: "0 1 1 2 3 5 8 13 21 34 55\n1 2 8 64 1024 ",
    displayCode: `#include <bits/stdc++.h>\nusing namespace std;\n\nint f(int n, vector<int>& memo) {\n    if (n <= 1) return n;\n    if (memo[n] != -1) return memo[n];\n    return memo[n] = f(n-1, memo) + f(n-2, memo);\n}\n\nint main() {\n    int n = 10;\n    vector<int> memo(n+1, -1);\n    for (int i = 0; i <= n; i++) {\n        cout << f(i, memo);\n        if (i < n) cout << " ";\n    }\n    cout << endl;\n    \n    int x = 1;\n    for (int i = 0; i < 5; i++) {\n        x = x << i;\n        cout << x << " ";\n    }\n    cout << endl;\n    return 0;\n}`,
  },

  // 8. CHOOSE THE APPROACH
  {
    id: "choose_approach",
    category: "Choose the Approach",
    categoryShort: "STRATEGY",
    icon: "\ud83c\udfb2",
    color: "#e91e63",
    description: `**The Duo Strike Formation**\n\nTwo Shadow Ninjas must pair up for a combined strike. Given an array of warrior power levels, find all pairs (i, j) where their combined power equals the Target value. (i \u2260 j, each pair counted once.)\n\nThe clan has up to **10\u2076** warriors. Memory limit: **256 MB**.\n\nWhich algorithmic approach should the Strategist choose?`,
    starterCode: null,
    uiType: "choices",
    choices: [
      {
        id: "A",
        label: "Brute Force — O(N\u00b2)",
        detail: "Two nested loops. Check every possible pair.",
        correct: false,
        reason: "\u274c O(N\u00b2) = 10\u00b9\u00b2 operations for N=10\u2076. Way too slow — TLE.",
      },
      {
        id: "B",
        label: "Hash Set — O(N) time, O(N) space",
        detail: "For each warrior, check if (Target \u2212 power) exists in a hash set.",
        correct: true,
        reason: "\u2705 O(N) time and space. Fast and memory-safe for N=10\u2076.",
      },
      {
        id: "C",
        label: "Sort + Two Pointers — O(N log N) time, O(1) extra space",
        detail: "Sort the array, then use left/right pointers converging to target.",
        correct: true,
        reason: "\u2705 O(N log N) time, O(1) extra space. Correct but loses original indices.",
      },
      {
        id: "D",
        label: "Binary Search per element — O(N log N)",
        detail: "For each warrior, binary search for the complementary power.",
        correct: true,
        reason: "\u2705 Correct and efficient. Same complexity as sort + two pointers.",
      },
    ],
    questions: [
      { q: "Which method(s) work correctly within time limits?", correct: ["B", "C", "D"] },
      { q: "Which is the fastest approach (best time complexity)?", correct: ["B"] },
      { q: "Which uses the least extra memory?", correct: ["C"] },
    ],
    hint: "O(N\u00b2) = 10\u00b9\u00b2 operations — that's way too slow for N=10\u2076.",
  },

  // 9. INTERACTIVE LOGIC
  {
    id: "interactive_logic",
    category: "Interactive Logic",
    categoryShort: "INTERACTIVE",
    icon: "\ud83d\udcac",
    color: "#00bcd4",
    description: `**The Hidden Seal**\n\nThe enemy has hidden a seal number between **1 and 1024**. You are a Shadow Scout with exactly **10 yes/no probes** to locate it.\n\nEach probe asks: *"Is the seal number \u2264 X?"*\nThe system responds **YES** or **NO**.\n\nAfter your probes, you must guess the exact seal number.\n\n**Constraints:**\n• Hidden number: 1 \u2264 secret \u2264 1024\n• Maximum probes: 10 (log\u2082(1024) = 10)\n\n*Use binary search. Each probe halves the search space. After 10 probes, only one number remains.*`,
    starterCode: null,
    uiType: "interactive",
    hint: "Binary search: start with [1, 1024]. Each query halves the range. After 10 queries you know exactly.",
  },
];

// ─── Weighted random category picker ─────────────────────────────────────────
export function pickChallenge() {
  const HISTORY_KEY = "sc_recent_history";
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    history = [];
  }

  const weights = CHALLENGES.map((c, i) => {
    const recentCount = history.filter((h) => h === i).length;
    return Math.max(1, 10 - recentCount * 4);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let chosen = 0;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      chosen = i;
      break;
    }
  }

  history.push(chosen);
  if (history.length > 3) history.shift();
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }

  return CHALLENGES[chosen];
}

// ─── Simulated judge for front-end only challenges ────────────────────────────
export function simulateRun(challenge, userAnswer) {
  if (challenge.uiType === "predict") {
    const clean = (s) =>
      s
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/ +\n/g, "\n")
        .replace(/ +$/gm, "");
    return clean(userAnswer) === clean(challenge.expectedOutput || "");
  }
  return null; // For editor challenges, real backend would handle
}
