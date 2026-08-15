/*
Problem: You are given an M × N grid containing only 0s and 1s.
1 represents a cell that can be visited.
0 represents a blocked cell.
Starting from a given cell (R, C), you can move in four directions:
Up Down Left Right

Find the minimum time (or number of steps) required to visit all reachable cells containing 1.
Each move to an adjacent cell takes 1 unit of time.

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains two integers:
N — number of columns.
M — number of rows.
The next M lines each contain N integers (0 or 1).
The last line contains two integers:
R C — starting cell (1-indexed).

Output:
For each test case print

Case #x
answer
where answer is the minimum number of steps required to visit all reachable cells.

Constraints
1 ≤ T ≤ 20
1 ≤ M, N ≤ 100
Grid contains only 0 and 1.
Example
Input
1
5 5
1 1 0 1 1
1 1 1 1 0
0 1 1 1 1
1 1 0 1 1
1 1 1 1 1
3 3
Output
Case #1
4
Approach

This is a Breadth-First Search (BFS) problem.

Start BFS from the given source cell.
Mark the source as visited.
Store (row, column, level) in the queue.
For every popped cell:
Visit its 4 neighbors.
If the neighbor contains 1 and is unvisited, push it with level + 1.
The largest level reached during BFS is the minimum time required to visit every reachable cell.
*/

#include <bits/stdc++.h>
using namespace std;

struct Node { int row; int col; int dist; };

int main() {
    int T;
    cin >> T;
    int dx[] = {-1, 1, 0, 0};
    int dy[] = {0, 0, -1, 1};
    for (int tc = 1; tc <= T; tc++) {
        int n, m;
        cin >> n >> m;
        vector<vector<int>> grid(m + 1, vector<int>(n + 1));
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                cin >> grid[i][j];
        int r, c;
        cin >> r >> c;
        queue<Node> q;
        q.push({c, r, 0});
        grid[c][r] = 2;
        int answer = 0;
        while (!q.empty()) {
            Node cur = q.front();
            q.pop();
            answer = max(answer, cur.dist);
            for (int k = 0; k < 4; k++) {
                int nr = cur.row + dx[k];
                int nc = cur.col + dy[k];
                if (nr >= 1 && nr <= m && nc >= 1 && nc <= n && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    q.push({nr, nc, cur.dist + 1});
                }
            }
        }
        cout << "Case #" << tc << "\n";
        cout << answer << "\n";
    }

    return 0;
}