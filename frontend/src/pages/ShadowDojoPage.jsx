import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Maximize2,
  ChevronRight,
  RotateCcw,
  Play,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Code2,
  HelpCircle,
  MessageSquare,
  Cpu,
  ArrowLeft,
  Zap,
  Info,
  X,
} from "lucide-react";

// ─── Language options ──────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

const LANG_STARTERS = {
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your solution\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Your solution\n    return 0;\n}`,
  python: `import sys\n\n# Your solution here\n`,
  javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");\n\n// Your solution here\n`,
};

// ─── Category info descriptions (for the ℹ️ modal) ────────────────────────
const CATEGORY_INFO = {
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
const CHALLENGES = [
  // 0. BLIND JUDGE — no test cases shown
  {
    id: "blind_judge",
    category: "Blind Judge",
    categoryShort: "BLIND",
    icon: "👁",
    color: "#9b59b6",
    description: `**The Scrolls of the Rising Path**

Master Kaze has hidden ancient scrolls along a mountain trail. Each scroll bears a power value. You must find the **longest sequence of scrolls** you can collect while walking uphill — each scroll must have **strictly greater power** than the previous one you picked.

The scrolls cannot be rearranged — you must pick them in the order they appear on the trail.

**Input:**
Line 1: N — number of scrolls (1 ≤ N ≤ 1000)
Line 2: N space-separated integers — power of each scroll (−10⁶ ≤ aᵢ ≤ 10⁶)

**Output:** A single integer — the longest strictly increasing subsequence length.

**Constraints:**
• 1 ≤ N ≤ 1000
• −10⁶ ≤ aᵢ ≤ 10⁶

*Your eyes are sealed. The Dojo only reveals ✓ or ✗.*`,
    starterCode: LANG_STARTERS,
    uiType: "blind",
    hint: "Think patience sorting or classic DP. dp[i] = longest increasing subsequence ending at index i.",
  },

  // 1. DEBUG THE CODE — buggy medium code
  {
    id: "debug_code",
    category: "Debug the Code",
    categoryShort: "DEBUG",
    icon: "🐛",
    color: "#e74c3c",
    description: `**The Broken Village Map**

The Shadow Village has been split into isolated districts after an earthquake. Messenger Ninja Rei wrote code to count the **number of disconnected districts** using BFS traversal of the village map.

But Rei's code has **3 bugs** — the village elders report wrong district counts! Find and fix all 3 bugs before the enemy discovers the vulnerable districts.

**Input:**
Line 1: N M — N districts (nodes), M roads (edges)
Next M lines: u v — road connecting district u and v (1-indexed, bidirectional)

**Output:** Number of disconnected districts (connected components).

**Constraints:**
• 1 ≤ N ≤ 1000, 0 ≤ M ≤ N×(N−1)/2
• 1 ≤ u, v ≤ N`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    
    vector<vector<int>> adj(n); // Bug 1: should be n+1 for 1-indexed
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        // Bug 2: missing reverse edge adj[v].push_back(u)
    }
    
    vector<bool> visited(n, false); // Bug 3: should be n+1
    int components = 0;
    
    for (int i = 1; i <= n; i++) {
        if (!visited[i]) {
            components++;
            queue<int> q;
            q.push(i);
            visited[i] = true;
            while (!q.empty()) {
                int node = q.front(); q.pop();
                for (int nb : adj[node]) {
                    if (!visited[nb]) {
                        visited[nb] = true;
                        q.push(nb);
                    }
                }
            }
        }
    }
    cout << components << endl;
    return 0;
}`,
      c: `#include <stdio.h>
#include <string.h>

#define MAXN 1005
int adj[MAXN][MAXN], visited[MAXN], n, m;

void bfs(int start) {
    int queue[MAXN], front = 0, back = 0;
    queue[back++] = start;
    visited[start] = 1;
    while (front < back) {
        int node = queue[front++];
        for (int i = 1; i <= n; i++) {
            if (adj[node][i] && !visited[i]) {
                visited[i] = 1;
                queue[back++] = i;
            }
        }
    }
}

int main() {
    scanf("%d %d", &n, &m);
    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d %d", &u, &v);
        adj[u][v] = 1;
        // Bug: missing adj[v][u] = 1
    }
    memset(visited, 0, sizeof(visited));
    int components = 0;
    for (int i = 1; i <= n; i++) {
        if (!visited[i]) {
            components++;
            bfs(i);
        }
    }
    printf("%d\\n", components);
    return 0;
}`,
      python: `import sys
from collections import deque

def main():
    input_data = sys.stdin.read().split()
    idx = 0
    n, m = int(input_data[idx]), int(input_data[idx+1])
    idx += 2
    
    adj = [[] for _ in range(n)]  # Bug 1: should be n+1
    for _ in range(m):
        u, v = int(input_data[idx]), int(input_data[idx+1])
        idx += 2
        adj[u].append(v)
        # Bug 2: missing adj[v].append(u)
    
    visited = [False] * (n)  # Bug 3: should be n+1
    components = 0
    
    for i in range(1, n + 1):
        if not visited[i]:
            components += 1
            q = deque([i])
            visited[i] = True
            while q:
                node = q.popleft()
                for nb in adj[node]:
                    if not visited[nb]:
                        visited[nb] = True
                        q.append(nb)
    
    print(components)

main()`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");
let idx = 0;
const [n, m] = lines[idx++].split(" ").map(Number);

const adj = Array.from({length: n}, () => []); // Bug 1: should be n+1
for (let i = 0; i < m; i++) {
    const [u, v] = lines[idx++].split(" ").map(Number);
    adj[u].push(v);
    // Bug 2: missing adj[v].push(u)
}

const visited = new Array(n).fill(false); // Bug 3: should be n+1
let components = 0;

for (let i = 1; i <= n; i++) {
    if (!visited[i]) {
        components++;
        const queue = [i];
        visited[i] = true;
        let front = 0;
        while (front < queue.length) {
            const node = queue[front++];
            for (const nb of adj[node]) {
                if (!visited[nb]) {
                    visited[nb] = true;
                    queue.push(nb);
                }
            }
        }
    }
}

console.log(components);`,
    },
    uiType: "debug",
    hint: "Look at array sizes (1-indexed vs 0-indexed) and bidirectional edges.",
  },

  // 2. OVERFLOW TRAP — inputs too large for long long
  {
    id: "overflow_trap",
    category: "Overflow Trap",
    categoryShort: "OVERFLOW",
    icon: "💥",
    color: "#e67e22",
    description: `**The Treasure of Infinite Coins**

The Shadow Clan's vault contains N golden coins, numbered 1 through N. The Grand Master asks: *What is the total value of all coins combined?*

Simple? The catch: N can be astronomically large — up to **10¹⁸** (a quintillion). Even \`long long\` can hold N itself, but **N × (N+1)** overflows every fixed-size integer type.

**Input:** A single integer N (1 ≤ N ≤ 10¹⁸)

**Output:** The sum 1 + 2 + ... + N.

**Constraints:**
• 1 ≤ N ≤ 10¹⁸
• The answer can exceed 10³⁶ — no primitive type can hold it!

*The starter code computes the formula but overflows. Fix it.*`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    // This overflows! n*(n+1) exceeds long long for n~10^18\n    long long result = n * (n + 1) / 2;\n    cout << result << endl;\n    return 0;\n}`,
      c: `#include <stdio.h>\n\nint main() {\n    long long n;\n    scanf("%lld", &n);\n    // This overflows! n*(n+1) exceeds long long range\n    long long result = n * (n + 1) / 2;\n    printf("%lld\\n", result);\n    return 0;\n}`,
      python: `n = int(input())\n# This works in Python (arbitrary precision) but think:\n# Can you make it work in C/C++ too?\n# Hint: you can't use long long for n*(n+1) when n=10^18\nresult = n * (n + 1) // 2\nprint(result)`,
      javascript: `const n = BigInt(require("fs").readFileSync(0,"utf8").trim());\n// BigInt handles this, but in C/C++ this overflows!\nconst result = n * (n + 1n) / 2n;\nconsole.log(result.toString());`,
    },
    uiType: "blind",
    hint: "N*(N+1) overflows long long when N≈10¹⁸. In C/C++, you need __int128, or use Python/JS BigInt. Alternatively: if N is even, compute (N/2)*(N+1); if odd, compute N*((N+1)/2).",
  },

  // 3. PRECISION TRAP
  {
    id: "precision_trap",
    category: "Precision Trap",
    categoryShort: "PRECISION",
    icon: "🎯",
    color: "#3498db",
    description: `**The Inscribed Training Ground**

Master Hiro is building a square training ground inside a circular arena. The arena has radius R. The square must be the **largest possible** that fits perfectly inside the circle (inscribed).

Hiro's apprentice wrote code using \`sqrt()\` and \`M_PI\` — but the answers come out wrong for large R values due to floating-point precision loss.

Find the **exact area** of the inscribed square.

**Input:** A single integer R (1 ≤ R ≤ 10⁹)

**Output:** Print the area with **exactly 6 decimal places**.

**Constraints:**
• 1 ≤ R ≤ 10⁹

*The starter code uses floating point and gets wrong answers. Find the exact formula.*`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long r;\n    cin >> r;\n    // WRONG: floating point precision loss for large R\n    double side = r * sqrt(2.0);\n    double area = side * side;\n    printf("%.6f\\n", area);\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <math.h>\n\nint main() {\n    long long r;\n    scanf("%lld", &r);\n    // WRONG: floating point precision loss\n    double side = r * sqrt(2.0);\n    double area = side * side;\n    printf("%.6f\\n", area);\n    return 0;\n}`,
      python: `import math\nr = int(input())\n# WRONG: floating point precision loss for large R\nside = r * math.sqrt(2)\narea = side * side\nprint(f"{area:.6f}")`,
      javascript: `const r = BigInt(require("fs").readFileSync(0,"utf8").trim());\n// WRONG approach using floats:\nconst side = Number(r) * Math.sqrt(2);\nconst area = side * side;\nconsole.log(area.toFixed(6));`,
    },
    uiType: "blind",
    hint: "Area = 2R². No floating point needed! The diagonal of the inscribed square = diameter = 2R, so side = 2R/√2, area = side² = 2R². Just output 2*R*R with .000000.",
  },

  // 4. FIX THE PERFORMANCE
  {
    id: "fix_performance",
    category: "Fix the Performance",
    categoryShort: "TLE FIX",
    icon: "⚡",
    color: "#f39c12",
    description: `**The Clan's Prime Cipher**

The Shadow Clan uses prime numbers as cipher keys. Guard Ninja Takeshi wrote a primality checker to validate keys, but it's **too slow** — enemy messages pile up while Takeshi's code crawls through each number up to N.

The code is **logically correct** but uses O(N) time per check. Fix it to handle keys up to **10¹²** within the time limit.

**Input:**
Line 1: T — number of keys to validate (T ≤ 1000)
Next T lines: one integer N each (1 ≤ N ≤ 10¹²)

**Output:** For each N: "YES" if prime, "NO" otherwise.

**Constraints:**
• 1 ≤ T ≤ 1000
• 1 ≤ N ≤ 10¹²`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    // This is O(N) — too slow for n up to 10^12
    for (long long i = 2; i < n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        cout << (isPrime(n) ? "YES" : "NO") << "\\n";
    }
    return 0;
}`,
      python: `import sys
input = sys.stdin.readline

def is_prime(n):
    if n < 2:
        return False
    # O(N) — too slow!
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

t = int(input())
for _ in range(t):
    n = int(input())
    print("YES" if is_prime(n) else "NO")`,
      c: `#include <stdio.h>

int isPrime(long long n) {
    if (n < 2) return 0;
    // O(N) — too slow
    for (long long i = 2; i < n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

int main() {
    int t;
    scanf("%d", &t);
    while (t--) {
        long long n;
        scanf("%lld", &n);
        printf("%s\\n", isPrime(n) ? "YES" : "NO");
    }
    return 0;
}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");
let idx = 0;
const t = parseInt(lines[idx++]);

function isPrime(n) {
    if (n < 2n) return false;
    // O(N) — too slow!
    for (let i = 2n; i < n; i++) {
        if (n % i === 0n) return false;
    }
    return true;
}

for (let i = 0; i < t; i++) {
    const n = BigInt(lines[idx++].trim());
    console.log(isPrime(n) ? "YES" : "NO");
}`,
    },
    uiType: "debug",
    hint: "Check only up to √N. Change `i < n` to `i * i <= n`. That's O(√N) — fast enough for 10¹².",
  },

  // 5. MEMORY OVERFLOW
  {
    id: "memory_overflow",
    category: "Memory Overflow",
    categoryShort: "MEMORY",
    icon: "🧠",
    color: "#1abc9c",
    description: `**The Lightest Path Through the Forest**

Ninja scout Yuki must cross an N×M grid forest from the top-left corner to the bottom-right, moving only **right** or **down**. Each cell has a danger value. Yuki must find the path with **minimum total danger**.

The Clan's old code works correctly but uses O(N×M) memory for the DP table — it crashes (MLE) for large forests.

**Fix it to use only O(M) memory.**

**Input:**
Line 1: N M — grid dimensions (1 ≤ N, M ≤ 1000)
Next N lines: M integers each — danger values (0 ≤ value ≤ 100)

**Output:** Minimum total danger along the path.

**Constraints:**
• 1 ≤ N, M ≤ 1000
• 0 ≤ cell value ≤ 100`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    
    // O(N*M) memory — too much for large grids
    vector<vector<int>> grid(n, vector<int>(m));
    vector<vector<long long>> dp(n, vector<long long>(m, 0));
    
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            cin >> grid[i][j];
    
    dp[0][0] = grid[0][0];
    for (int j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    for (int i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    
    for (int i = 1; i < n; i++)
        for (int j = 1; j < m; j++)
            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j];
    
    cout << dp[n-1][m-1] << "\\n";
    return 0;
}`,
      python: `import sys
input = sys.stdin.readline

def main():
    n, m = map(int, input().split())
    grid = []
    for _ in range(n):
        grid.append(list(map(int, input().split())))
    
    # O(N*M) memory — refactor to O(M)
    dp = [[0]*m for _ in range(n)]
    dp[0][0] = grid[0][0]
    for j in range(1, m): dp[0][j] = dp[0][j-1] + grid[0][j]
    for i in range(1, n): dp[i][0] = dp[i-1][0] + grid[i][0]
    
    for i in range(1, n):
        for j in range(1, m):
            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
    
    print(dp[n-1][m-1])

main()`,
      c: `#include <stdio.h>
#define MAXN 1005

// O(N*M) memory
long long dp[MAXN][MAXN];
int grid[MAXN][MAXN];

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            scanf("%d", &grid[i][j]);
    
    dp[0][0] = grid[0][0];
    for (int j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
    for (int i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];
    
    for (int i = 1; i < n; i++)
        for (int j = 1; j < m; j++)
            dp[i][j] = (dp[i-1][j] < dp[i][j-1] ? dp[i-1][j] : dp[i][j-1]) + grid[i][j];
    
    printf("%lld\\n", dp[n-1][m-1]);
    return 0;
}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");
let idx = 0;
const [n, m] = lines[idx++].split(" ").map(Number);

// O(N*M) memory
const grid = [];
for (let i = 0; i < n; i++) grid.push(lines[idx++].split(" ").map(Number));

const dp = Array.from({length: n}, () => new Array(m).fill(0));
dp[0][0] = grid[0][0];
for (let j = 1; j < m; j++) dp[0][j] = dp[0][j-1] + grid[0][j];
for (let i = 1; i < n; i++) dp[i][0] = dp[i-1][0] + grid[i][0];

for (let i = 1; i < n; i++)
    for (let j = 1; j < m; j++)
        dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1]) + grid[i][j];

console.log(dp[n-1][m-1]);`,
    },
    uiType: "debug",
    hint: "You only need the previous row. Use a 1D dp array and update in-place.",
  },

  // 6. FILL THE MISSING PART
  {
    id: "fill_missing",
    category: "Fill the Missing Part",
    categoryShort: "FILL IN",
    icon: "🧩",
    color: "#8e44ad",
    description: `**The Rank of the Warrior**

In the Shadow Clan's tournament, each warrior has a power score. The Grand Master needs to quickly find the warrior ranked K-th weakest (the K-th smallest power) **without sorting the entire roster** — a full sort would alert enemy spies monitoring computation patterns.

Complete the **Quickselect algorithm** — fill in the \`partition\` and \`quickSelect\` functions.

**Input:**
Line 1: N K — number of warriors and desired rank
Line 2: N integers — power scores

**Output:** The K-th smallest power value (1-indexed).

**Constraints:**
• 1 ≤ K ≤ N ≤ 10⁵
• −10⁹ ≤ power ≤ 10⁹`,
    starterCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

// TODO: Implement the partition function (Lomuto or Hoare scheme)
// Returns the final index of the pivot
int partition(vector<int>& arr, int left, int right) {
    // YOUR CODE HERE
}

// TODO: Implement quickSelect
// Returns the k-th smallest element (0-indexed k)
int quickSelect(vector<int>& arr, int left, int right, int k) {
    // YOUR CODE HERE
}

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> arr(n);
    for (int& x : arr) cin >> x;
    cout << quickSelect(arr, 0, n - 1, k - 1) << "\\n";
    return 0;
}`,
      python: `import sys
input = sys.stdin.readline

# TODO: Implement partition (Lomuto scheme)
# Partitions arr[left..right] around arr[right] as pivot
# Returns final pivot index
def partition(arr, left, right):
    # YOUR CODE HERE
    pass

# TODO: Implement quickSelect
# Returns the k-th smallest element (0-indexed k)
def quick_select(arr, left, right, k):
    # YOUR CODE HERE
    pass

def main():
    n, k = map(int, input().split())
    arr = list(map(int, input().split()))
    print(quick_select(arr, 0, n - 1, k - 1))

main()`,
      c: `#include <stdio.h>

void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }

// TODO: Implement partition
int partition(int* arr, int left, int right) {
    // YOUR CODE HERE
}

// TODO: Implement quickSelect
int quickSelect(int* arr, int left, int right, int k) {
    // YOUR CODE HERE
}

int main() {
    int n, k;
    scanf("%d %d", &n, &k);
    int arr[100005];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", quickSelect(arr, 0, n - 1, k - 1));
    return 0;
}`,
      javascript: `const lines = require("fs").readFileSync(0,"utf8").trim().split("\\n");
const [n, k] = lines[0].split(" ").map(Number);
const arr = lines[1].split(" ").map(Number);

// TODO: Implement partition (Lomuto scheme)
function partition(arr, left, right) {
    // YOUR CODE HERE
}

// TODO: Implement quickSelect  
function quickSelect(arr, left, right, k) {
    // YOUR CODE HERE
}

console.log(quickSelect(arr, 0, n - 1, k - 1));`,
    },
    uiType: "debug",
    hint: "Lomuto partition: pick arr[right] as pivot. Place smaller elements to the left. Return the pivot's final position.",
  },

  // 7. PREDICT THE OUTPUT
  {
    id: "predict_output",
    category: "Predict the Output",
    categoryShort: "PREDICT",
    icon: "🔮",
    color: "#2ecc71",
    description: `**The Cipher Scroll**

Intercepted from an enemy messenger — this code fragment was used to encode a secret signal. The enemy ran this code and transmitted the output as a coded message.

Study the code carefully and predict **exactly** what it prints (two lines of output).

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;

int f(int n, vector<int>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = f(n-1, memo) + f(n-2, memo);
}

int main() {
    int n = 10;
    vector<int> memo(n+1, -1);
    for (int i = 0; i <= n; i++) {
        cout << f(i, memo);
        if (i < n) cout << " ";
    }
    cout << endl;
    
    // What does this print?
    int x = 1;
    for (int i = 0; i < 5; i++) {
        x = x << i;
        cout << x << " ";
    }
    cout << endl;
    return 0;
}
\`\`\`

Type the **exact output** (two lines) in the answer box below.`,
    starterCode: null, // No editor — text input only
    uiType: "predict",
    hint: "First line: Fibonacci sequence (0 through F(10)). Second line: bit-shifting — trace carefully: x starts at 1, then x<<=0→1, x<<=1→2, x<<=2→8, x<<=3→64, x<<=4→1024.",
    expectedOutput: "0 1 1 2 3 5 8 13 21 34 55\n1 2 8 64 1024 ",
    displayCode: `#include <bits/stdc++.h>
using namespace std;

int f(int n, vector<int>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = f(n-1, memo) + f(n-2, memo);
}

int main() {
    int n = 10;
    vector<int> memo(n+1, -1);
    for (int i = 0; i <= n; i++) {
        cout << f(i, memo);
        if (i < n) cout << " ";
    }
    cout << endl;
    
    int x = 1;
    for (int i = 0; i < 5; i++) {
        x = x << i;
        cout << x << " ";
    }
    cout << endl;
    return 0;
}`,
  },

  // 8. CHOOSE THE APPROACH
  {
    id: "choose_approach",
    category: "Choose the Approach",
    categoryShort: "STRATEGY",
    icon: "🎲",
    color: "#e91e63",
    description: `**The Duo Strike Formation**

Two Shadow Ninjas must pair up for a combined strike. Given an array of warrior power levels, find all pairs (i, j) where their combined power equals the Target value. (i ≠ j, each pair counted once.)

The clan has up to **10⁶** warriors. Memory limit: **256 MB**.

Which algorithmic approach should the Strategist choose?`,
    starterCode: null,
    uiType: "choices",
    choices: [
      {
        id: "A",
        label: "Brute Force — O(N²)",
        detail: "Two nested loops. Check every possible pair.",
        correct: false,
        reason: "❌ O(N²) = 10¹² operations for N=10⁶. Way too slow — TLE.",
      },
      {
        id: "B",
        label: "Hash Set — O(N) time, O(N) space",
        detail: "For each warrior, check if (Target − power) exists in a hash set.",
        correct: true,
        reason: "✅ O(N) time and space. Fast and memory-safe for N=10⁶.",
      },
      {
        id: "C",
        label: "Sort + Two Pointers — O(N log N) time, O(1) extra space",
        detail: "Sort the array, then use left/right pointers converging to target.",
        correct: true,
        reason: "✅ O(N log N) time, O(1) extra space. Correct but loses original indices.",
      },
      {
        id: "D",
        label: "Binary Search per element — O(N log N)",
        detail: "For each warrior, binary search for the complementary power.",
        correct: true,
        reason: "✅ Correct and efficient. Same complexity as sort + two pointers.",
      },
    ],
    questions: [
      { q: "Which method(s) work correctly within time limits?", correct: ["B", "C", "D"] },
      { q: "Which is the fastest approach (best time complexity)?", correct: ["B"] },
      { q: "Which uses the least extra memory?", correct: ["C"] },
    ],
    hint: "O(N²) = 10¹² operations — that's way too slow for N=10⁶.",
  },

  // 9. INTERACTIVE LOGIC
  {
    id: "interactive_logic",
    category: "Interactive Logic",
    categoryShort: "INTERACTIVE",
    icon: "💬",
    color: "#00bcd4",
    description: `**The Hidden Seal**

The enemy has hidden a seal number between **1 and 1024**. You are a Shadow Scout with exactly **10 yes/no probes** to locate it.

Each probe asks: *"Is the seal number ≤ X?"*
The system responds **YES** or **NO**.

After your probes, you must guess the exact seal number.

**Constraints:**
• Hidden number: 1 ≤ secret ≤ 1024
• Maximum probes: 10 (log₂(1024) = 10)

*Use binary search. Each probe halves the search space. After 10 probes, only one number remains.*`,
    starterCode: null,
    uiType: "interactive",
    hint: "Binary search: start with [1, 1024]. Each query halves the range. After 10 queries you know exactly.",
  },
];

// ─── Weighted random category picker ─────────────────────────────────────────
function pickChallenge() {
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
function simulateRun(challenge, userAnswer) {
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

// ─── Category badge component with info button ───────────────────────────────
function CategoryBadge({ challenge, onInfoClick }) {
  return (
    <div className="dojo-cat-badge" style={{ "--cat-color": challenge.color }}>
      <span className="dojo-cat-icon">{challenge.icon}</span>
      <div className="dojo-cat-info">
        <span className="dojo-cat-short">{challenge.categoryShort}</span>
        <span className="dojo-cat-full">{challenge.category}</span>
      </div>
      <button
        className="dojo-cat-info-btn"
        onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
        title="What is this category?"
      >
        <Info size={14} />
      </button>
    </div>
  );
}

// ─── Category Info Modal ─────────────────────────────────────────────────────
function CategoryInfoModal({ challenge, onClose }) {
  const info = CATEGORY_INFO[challenge.category];
  if (!info) return null;

  return (
    <div className="dojo-info-overlay" onClick={onClose}>
      <div className="dojo-info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dojo-info-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="dojo-info-header" style={{ "--cat-color": challenge.color }}>
          <span className="dojo-info-icon">{challenge.icon}</span>
          <h3>{info.title}</h3>
        </div>
        <div className="dojo-info-body">
          <div className="dojo-info-section">
            <h4>What is this?</h4>
            <p>{info.description}</p>
          </div>
          <div className="dojo-info-section">
            <h4>What should you do?</h4>
            <p>{info.whatToDo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Choice UI (for "Choose the Approach") ───────────────────────────────────
function ChoiceUI({ challenge, onResult }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const question = challenge.questions[currentQ];

  const toggleChoice = (id) => {
    if (submitted) return;
    setSelections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitQ = () => {
    setSubmitted(true);
    setRevealed(true);
    const correct = question.correct.sort().join(",");
    const given = [...selections].sort().join(",");
    if (correct === given) {
      if (currentQ < challenge.questions.length - 1) {
        setTimeout(() => {
          setCurrentQ((q) => q + 1);
          setSelections([]);
          setSubmitted(false);
          setRevealed(false);
        }, 2000);
      } else {
        setTimeout(() => onResult(true), 2000);
      }
    }
  };

  return (
    <div className="dojo-choices-ui">
      <div className="dojo-question-header">
        <span className="dojo-q-counter">
          Question {currentQ + 1} / {challenge.questions.length}
        </span>
        <p className="dojo-q-text">{question.q}</p>
      </div>

      <div className="dojo-choice-list">
        {challenge.choices.map((c) => {
          const isSelected = selections.includes(c.id);
          const isCorrect = question.correct.includes(c.id);
          let state = "";
          if (revealed) {
            state = isSelected && isCorrect ? "correct" : isSelected && !isCorrect ? "wrong" : isCorrect ? "missed" : "neutral";
          } else if (isSelected) {
            state = "selected";
          }

          return (
            <button
              key={c.id}
              className={`dojo-choice-item dojo-choice-${state}`}
              onClick={() => toggleChoice(c.id)}
              disabled={submitted}
            >
              <div className="dojo-choice-letter">{c.id}</div>
              <div className="dojo-choice-body">
                <strong>{c.label}</strong>
                <span>{c.detail}</span>
                {revealed && isCorrect && (
                  <div className="dojo-choice-reason">{c.reason}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          className="dojo-action-btn"
          onClick={handleSubmitQ}
          disabled={selections.length === 0}
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}

// ─── Interactive logic UI ────────────────────────────────────────────────────
function InteractiveUI({ onResult }) {
  const secretRef = useRef(Math.floor(Math.random() * 1024) + 1);
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(1024);
  const [queryValue, setQueryValue] = useState(512);
  const [queriesLeft, setQueriesLeft] = useState(10);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("query"); // query | guess
  const [guess, setGuess] = useState("");
  const [ended, setEnded] = useState(false);

  const askQuery = () => {
    if (queriesLeft <= 0 || ended) return;
    const x = parseInt(queryValue);
    const answer = x >= secretRef.current ? "YES" : "NO";
    const newLog = [...log, { q: `Is the seal ≤ ${x}?`, a: answer }];
    setLog(newLog);
    setQueriesLeft((q) => q - 1);

    if (answer === "YES") setHigh(x);
    else setLow(x + 1);

    if (queriesLeft - 1 === 0) setPhase("guess");
  };

  const makeGuess = () => {
    const g = parseInt(guess);
    const correct = g === secretRef.current;
    setEnded(true);
    setLog((l) => [
      ...l,
      {
        q: `Final guess: ${g}`,
        a: correct ? `✅ CORRECT! The seal was ${secretRef.current}.` : `❌ WRONG. The seal was ${secretRef.current}.`,
      },
    ]);
    setTimeout(() => onResult(correct), 1500);
  };

  const midpoint = Math.floor((low + high) / 2);

  return (
    <div className="dojo-interactive-ui">
      <div className="dojo-interactive-header">
        <div className="dojo-query-counter">
          <Zap size={14} />
          {queriesLeft} probes remaining
        </div>
        <div className="dojo-range-hint">
          Search range: [{low}, {high}]
        </div>
      </div>

      <div className="dojo-log">
        {log.map((entry, i) => (
          <div key={i} className="dojo-log-entry">
            <span className="dojo-log-q">❓ {entry.q}</span>
            <span className={`dojo-log-a ${entry.a.startsWith("YES") || entry.a.startsWith("✅") ? "yes" : "no"}`}>
              {entry.a}
            </span>
          </div>
        ))}
      </div>

      {!ended && phase === "query" && (
        <div className="dojo-query-form">
          <label>Probe: Is the seal ≤</label>
          <div className="dojo-query-input-row">
            <input
              type="number"
              min={low}
              max={high}
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              className="dojo-query-input"
            />
            <button className="dojo-action-btn small" onClick={() => setQueryValue(midpoint)}>
              Midpoint ({midpoint})
            </button>
            <button className="dojo-action-btn" onClick={askQuery} disabled={queriesLeft === 0}>
              Ask
            </button>
          </div>
        </div>
      )}

      {!ended && phase === "guess" && (
        <div className="dojo-guess-form">
          <p className="dojo-guess-label">No more probes! Make your final guess:</p>
          <div className="dojo-query-input-row">
            <input
              type="number"
              min={1}
              max={1024}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="dojo-query-input"
            />
            <button className="dojo-action-btn" onClick={makeGuess}>
              Guess!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Predict Output UI ───────────────────────────────────────────────────────
function PredictUI({ challenge, onResult }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);

  const handleSubmit = () => {
    const result = simulateRun(challenge, userAnswer);
    setCorrect(result);
    setSubmitted(true);
    setTimeout(() => onResult(result), 1800);
  };

  return (
    <div className="dojo-predict-ui">
      <div className="dojo-predict-code">
        <div className="dojo-predict-code-header">
          <Code2 size={14} />
          <span>C++ Code to Analyze</span>
        </div>
        <pre className="dojo-predict-pre">{challenge.displayCode}</pre>
      </div>

      <div className="dojo-predict-answer">
        <label>Your predicted output (type exactly):</label>
        <textarea
          className="dojo-predict-textarea"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={submitted}
          placeholder={"Line 1\nLine 2"}
          rows={4}
          spellCheck={false}
        />
        {submitted && correct !== null && (
          <div className={`dojo-predict-verdict ${correct ? "pass" : "fail"}`}>
            {correct ? "✅ Correct!" : `❌ Wrong. Expected:\n${challenge.expectedOutput}`}
          </div>
        )}
        {!submitted && (
          <button
            className="dojo-action-btn"
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
          >
            Submit Prediction
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ninja motivation quotes for the intro ────────────────────────────────────
const NINJA_QUOTES = [
  { text: "The blade is sharpened in silence.", sub: "— Shadow Proverb" },
  { text: "True skill reveals itself under pressure.", sub: "— Master Kaze" },
  { text: "A ninja's mind is the deadliest weapon.", sub: "— Ancient Scroll" },
  { text: "In darkness, the prepared warrior thrives.", sub: "— Grand Master Hiro" },
  { text: "Every mystery conquered is a step toward mastery.", sub: "— Dojo Creed" },
];

// ─── Main Dojo Page ───────────────────────────────────────────────────────────
export default function ShadowDojoPage() {
  const navigate = useNavigate();

  // Phase: intro → reveal → challenge → result
  const [phase, setPhase] = useState("intro");
  const [challenge, setChallenge] = useState(null);
  const [revealStep, setRevealStep] = useState(0);

  // Editor state
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  // Run/submit state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  // Result state
  const [finalResult, setFinalResult] = useState(null);

  // Quote for intro
  const [quote] = useState(() => NINJA_QUOTES[Math.floor(Math.random() * NINJA_QUOTES.length)]);

  // Sync editor code when language or challenge changes
  useEffect(() => {
    if (!challenge) return;
    if (challenge.starterCode === null) return;
    const templates = challenge.starterCode;
    setCode(templates[language] || LANG_STARTERS[language]);
  }, [language, challenge]);

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleStart = () => {
    // Enter fullscreen first
    handleFullscreen();

    const picked = pickChallenge();
    setChallenge(picked);
    setRevealStep(0);
    setPhase("reveal");
    setRunResult(null);
    setShowHint(false);
    setShowCategoryInfo(false);
    setFinalResult(null);

    // Animate reveal steps
    setTimeout(() => setRevealStep(1), 600);
    setTimeout(() => setRevealStep(2), 1400);
    setTimeout(() => {
      setPhase("challenge");
      if (picked.starterCode) {
        setCode(picked.starterCode[language] || LANG_STARTERS[language]);
      }
    }, 2600);
  };

  const handleRun = async () => {
    if (!challenge) return;
    setIsRunning(true);
    setRunResult(null);

    // Simulate run for front-end demo
    await new Promise((res) => setTimeout(res, 1200 + Math.random() * 800));

    if (challenge.uiType === "blind") {
      // Random result for demo — in production, connect to backend
      const passed = Math.random() > 0.4;
      setRunResult({ verdict: passed ? "Accepted" : "Wrong Answer", blind: true });
    } else {
      setRunResult({
        verdict: "Accepted",
        stdout: "Output matches expected.",
        stderr: "",
      });
    }

    setIsRunning(false);
  };

  const handleResult = (correct) => {
    setFinalResult(correct);
    setPhase("result");
  };

  const handleReset = () => {
    setPhase("intro");
    setChallenge(null);
    setRunResult(null);
    setFinalResult(null);
    setRevealStep(0);
    setShowHint(false);
    setShowCategoryInfo(false);
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="dojo-fullscreen dojo-intro">
        <div className="dojo-intro-fog" />
        <div className="dojo-intro-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="dojo-intro-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
              }}
            />
          ))}
        </div>

        <div className="dojo-intro-content">
          <div className="dojo-intro-badge">
            <span>⚔</span> Mystery Dojo
          </div>
          <h1 className="dojo-intro-title">
            <span className="dojo-title-shadow">Shadow</span>
            <span className="dojo-title-code">Code</span>
          </h1>

          {/* Ninja motivation quote */}
          <div className="dojo-intro-quote">
            <p className="dojo-quote-text">"{quote.text}"</p>
            <span className="dojo-quote-attr">{quote.sub}</span>
          </div>

          <p className="dojo-intro-sub">
            Sharpen your mind. A mystery challenge awaits — its nature unknown.
          </p>

          <div className="dojo-intro-actions">
            <button className="dojo-start-btn" id="dojo-start-btn" onClick={handleStart}>
              <span className="dojo-start-glow" />
              <Play size={20} />
              Begin
            </button>
          </div>
        </div>

        <button className="dojo-back-btn" onClick={() => navigate("/shadow-code")}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  // ── REVEAL ─────────────────────────────────────────────────────────────────
  if (phase === "reveal") {
    return (
      <div className="dojo-fullscreen dojo-reveal">
        <div className="dojo-reveal-content">
          {revealStep >= 1 && (
            <div className={`dojo-reveal-label ${revealStep >= 1 ? "visible" : ""}`}>
              Your challenge category is...
            </div>
          )}
          {revealStep >= 2 && challenge && (
            <div className="dojo-reveal-category">
              <div
                className="dojo-reveal-icon"
                style={{ "--cat-color": challenge.color }}
              >
                {challenge.icon}
              </div>
              <div className="dojo-reveal-name" style={{ color: challenge.color }}>
                {challenge.category}
              </div>
              <div className="dojo-reveal-desc">{challenge.categoryShort}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="dojo-fullscreen dojo-result">
        <div className="dojo-result-content">
          <div className={`dojo-result-icon ${finalResult ? "pass" : "fail"}`}>
            {finalResult ? (
              <CheckCircle2 size={64} />
            ) : (
              <XCircle size={64} />
            )}
          </div>
          <h2 className={`dojo-result-title ${finalResult ? "pass" : "fail"}`}>
            {finalResult ? "Challenge Conquered!" : "The Shadow Wins This Round"}
          </h2>
          <p className="dojo-result-category">{challenge?.category}</p>
          {!finalResult && challenge?.hint && (
            <div className="dojo-result-hint">
              <strong>Insight:</strong> {challenge.hint}
            </div>
          )}
          <div className="dojo-result-actions">
            <button className="dojo-start-btn" onClick={handleReset}>
              <RotateCcw size={16} /> Try Another
            </button>
            <button className="dojo-back-btn-large" onClick={() => navigate("/shadow-code")}>
              Exit Dojo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CHALLENGE ──────────────────────────────────────────────────────────────
  const isEditorChallenge = challenge?.uiType === "blind" || challenge?.uiType === "debug";
  const isChoiceChallenge = challenge?.uiType === "choices";
  const isPredictChallenge = challenge?.uiType === "predict";
  const isInteractiveChallenge = challenge?.uiType === "interactive";

  return (
    <div className="dojo-fullscreen dojo-workspace">
      {/* Category Info Modal */}
      {showCategoryInfo && challenge && (
        <CategoryInfoModal
          challenge={challenge}
          onClose={() => setShowCategoryInfo(false)}
        />
      )}

      {/* Header */}
      <header className="dojo-header">
        <div className="dojo-header-left">
          <button className="dojo-back-small" onClick={handleReset}>
            <ArrowLeft size={14} />
          </button>
          {challenge && (
            <CategoryBadge
              challenge={challenge}
              onInfoClick={() => setShowCategoryInfo(true)}
            />
          )}
        </div>

        <div className="dojo-header-right">
          {isEditorChallenge && (
            <>
              <div className="dojo-lang-picker">
                <Code2 size={13} color="var(--accent)" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="dojo-lang-select"
                >
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={`dojo-run-btn ${isRunning ? "loading" : ""}`}
                onClick={handleRun}
                disabled={isRunning}
                id="dojo-run-btn"
              >
                {isRunning ? <Loader2 size={14} className="anim-spin" /> : <Play size={14} />}
                Run
              </button>

              <button
                className="dojo-submit-btn"
                onClick={() => handleResult(runResult?.verdict === "Accepted")}
                disabled={!runResult || isRunning}
                id="dojo-submit-btn"
              >
                <Send size={14} />
                Submit
              </button>
            </>
          )}

          <button
            className="dojo-hint-btn"
            onClick={() => setShowHint((v) => !v)}
            title="Reveal hint"
          >
            <HelpCircle size={14} />
            {showHint ? "Hide Hint" : "Hint"}
          </button>

          <button className="dojo-fs-btn-small" onClick={handleFullscreen}>
            <Maximize2 size={14} />
          </button>
        </div>
      </header>

      {/* Hint bar */}
      {showHint && challenge?.hint && (
        <div className="dojo-hint-bar">
          <span className="dojo-hint-label">💡 Hint:</span> {challenge.hint}
        </div>
      )}

      {/* Main area */}
      <main className="dojo-main">
        {/* Left: description */}
        <div className="dojo-left-panel">
          <div className="dojo-problem-header">
            <div className="dojo-problem-cat" style={{ color: challenge?.color }}>
              {challenge?.icon} {challenge?.category}
            </div>
          </div>
          <div
            className="dojo-problem-body"
            dangerouslySetInnerHTML={{
              __html: challenge?.description
                ? challenge.description
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(/`([^`]+)`/g, "<code>$1</code>")
                    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
                    .replace(/\n/g, "<br/>")
                : "",
            }}
          />
        </div>

        <div className="dojo-divider" />

        {/* Right: editor / special UI */}
        <div className="dojo-right-panel">
          {isEditorChallenge && (
            <>
              <div className="dojo-editor-wrapper">
                <Editor
                  height="100%"
                  language={
                    language === "cpp"
                      ? "cpp"
                      : language === "javascript"
                      ? "javascript"
                      : language === "python"
                      ? "python"
                      : "c"
                  }
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                />
              </div>

              {/* Run result */}
              {runResult && (
                <div
                  className={`dojo-run-result ${
                    runResult.verdict === "Accepted" ? "pass" : "fail"
                  }`}
                >
                  {runResult.verdict === "Accepted" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <strong>{runResult.verdict}</strong>
                  {runResult.blind && (
                    <span className="dojo-blind-note">
                      (Test cases are hidden in this challenge)
                    </span>
                  )}
                  {runResult.stdout && !runResult.blind && (
                    <span>{runResult.stdout}</span>
                  )}
                </div>
              )}
            </>
          )}

          {isChoiceChallenge && (
            <div className="dojo-special-ui">
              <ChoiceUI challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isPredictChallenge && (
            <div className="dojo-special-ui">
              <PredictUI challenge={challenge} onResult={handleResult} />
            </div>
          )}

          {isInteractiveChallenge && (
            <div className="dojo-special-ui">
              <InteractiveUI onResult={handleResult} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
