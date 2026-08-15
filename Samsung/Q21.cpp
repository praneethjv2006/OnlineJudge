/*
Problem: Mr. Lee starts from Office 1 (Company).
He must:
Visit every other office exactly once.
Return back to Office 1.
Some routes may not exist (cost = 0).

Find the minimum airfare required.
If it is impossible to complete the tour, print -1.

Input:
First line contains T — number of test cases.
For each test case:
First line contains N — number of offices.
Next N lines contain an N × N cost matrix.
cost[i][j] = airfare from office i to office j.
0 means no direct flight (except i == j).

Output:
For each test case print minimum airfare  or  -1 if no complete tour exists.

Constraints
1 ≤ N ≤ 12
Example
Input
1
4
0 10 15 20
10 0 35 25
15 35 0 30
20 25 30 0
Output
80
*/


#include <bits/stdc++.h>
using namespace std;
int n;
int cost[15][15];
bool visited[15];

int answer;
void dfs(int city, int count, int totalCost) {
    // Pruning
    if (totalCost >= answer) return;
    // All offices visited
    if (count == n) {
        if (cost[city][0] != 0) answer = min(answer, totalCost + cost[city][0]);
        return;
    }
    for (int next = 1; next < n; next++) {
        if (!visited[next] && cost[city][next] != 0) {
            visited[next] = true;
            dfs(next, count + 1, totalCost + cost[city][next]);
            visited[next] = false;
        }
    }
}

int main() {
    int T;
    cin >> T;
    while (T--) {
        cin >> n;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                cin >> cost[i][j];
        answer = INT_MAX;
        memset(visited, false, sizeof(visited));
        visited[0] = true;
        dfs(0, 1, 0);
        if (answer == INT_MAX)
            cout << -1 << "\n";
        else
            cout << answer << "\n";
    }

    return 0;
}




#include <bits/stdc++.h>
using namespace std;

const int INF = 1e9;

int n;
int cost[13][13];
int dp[1 << 12][13];

int solve(int mask, int city) {
    // All offices visited
    if (mask == (1 << n) - 1) {
        if (cost[city][0] == 0) return INF;
        return cost[city][0];
    }
    if (dp[mask][city] != -1) return dp[mask][city];
    int ans = INF;
    for (int next = 0; next < n; next++) {
        // Already visited
        if (mask & (1 << next)) continue;
        // No path
        if (cost[city][next] == 0) continue;
        ans = min(ans, cost[city][next] + solve(mask | (1 << next), next));
    }

    return dp[mask][city] = ans;
}

int main() {
    int T;
    cin >> T;
    while (T--) {
        cin >> n;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                cin >> cost[i][j];
        memset(dp, -1, sizeof(dp));
        int ans = solve(1, 0);   // Only office 0 visited
        if (ans >= INF)
            cout << -1 << "\n";
        else
            cout << ans << "\n";
    }

    return 0;
}