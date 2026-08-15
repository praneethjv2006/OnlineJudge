/*
Problem: You are given an N × N grid containing only 0s and 1s.

1 represents a valid cell where the frog can stand.
0 represents an empty cell that cannot be visited.

The frog starts at a given source cell and wants to reach a destination cell.

Movement Rules:
The frog can move left or right to an adjacent cell containing 1 without any cost.
The frog can move up or down to an adjacent cell containing 1.
Every vertical move (up or down) costs 1 jump.

Find the minimum number of jumps required to reach the destination.
If the destination cannot be reached, print -1.

Input:
The first line contains an integer N.
The next N lines contain N integers (0 or 1) representing the grid.
The last line contains four integers:
sourceRow sourceCol destinationRow destinationCol

Output:
Print a single integer representing the minimum number of jumps required.
If the destination cannot be reached, print -1.

Constraints:
1 ≤ N ≤ 100
Grid values are 0 or 1.
Source and destination are valid cells containing 1.
Example:
Input
5
1 1 0 1 1
0 1 1 1 0
1 1 0 1 1
1 0 1 1 1
1 1 1 0 1
0 0 4 4
Output
2
*/

//you can use priority queue or deque to implement 0-1 BFS

#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> grid(n, vector<int>(n));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cin >> grid[i][j];
        }
    }
    int sx, sy, tx, ty;
    cin >> sx >> sy >> tx >> ty;
    const int INF = 1e9;
    vector<vector<int>> dist(n, vector<int>(n, INF));
    deque<pair<int,int>> dq;
    dist[sx][sy] = 0;
    dq.push_front({sx, sy});
    int dx[4] = {-1, 1, 0, 0};
    int dy[4] = {0, 0, -1, 1};
    while (!dq.empty()) {
        auto cur = dq.front();
        dq.pop_front();
        int x = cur.first;
        int y = cur.second;
        for (int k = 0; k < 4; k++) {
            int nx = x + dx[k];
            int ny = y + dy[k];
            if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
            if (grid[nx][ny] == 0) continue;

            int cost;
            // Vertical move
            if (k == 0 || k == 1) cost = 1;
            else cost = 0;
            if (dist[nx][ny] > dist[x][y] + cost) {
                dist[nx][ny] = dist[x][y] + cost;
                if (cost == 0) dq.push_front({nx, ny});
                else dq.push_back({nx, ny});
            }
        }
    }

    if (dist[tx][ty] == INF)
        cout << -1;
    else
        cout << dist[tx][ty];

    return 0;
}