/*
Research Center Location
Problem Statement:
A research team has discovered several rare elements in a region. They want to build a Research Center on a road
 cell such that it is as close as possible to all the rare-element locations.
The region is represented as an N × N grid.

1 represents a road.
0 represents blocked land (cannot be used or crossed).
The locations of all rare elements are given separately, and they are guaranteed to be on road cells.
The research center can be built only on a road cell.

The distance between two cells is the minimum number of moves (up, down, left, right) required to travel using only road cells.

For every possible road cell where the research center can be built:
Find the shortest distance to each rare element.
Let maxDistance be the largest of these distances.

Your task is to find the minimum possible value of maxDistance over all valid road cells.

Example
Input
Grid =
1 1 1
1 1 1
1 1 1

Rare Elements:
(1,1)
(3,3)

Possible center:

(2,2)

Distance to (1,1) = 2

Distance to (3,3) = 2

Maximum = 2

Output

2
Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ 20
1 ≤ K ≤ 5 (Number of rare elements)
Grid contains only 0 and 1.
Rare element locations are always on road cells.
All rare elements are connected through roads.
Approach (Brute Force + BFS)

Since

N ≤ 20
Total cells = 400
Rare elements ≤ 5

We can simply try every road cell as the research center.

For every road cell:

Run BFS.
Compute distance to every rare element.
Take the maximum distance.
Minimize this maximum over all road cells.
Algorithm

For every cell in the grid

If it is not a road, skip.
Run BFS from this cell.
Store shortest distance to every cell.
Find the maximum distance among all rare-element locations.
Update answer.
*/

#include <bits/stdc++.h>
using namespace std;

const int INF = 1e9;

int dx[] = {-1, 1, 0, 0};
int dy[] = {0, 0, -1, 1};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int N, K;
        cin >> N >> K;
        vector<pair<int, int>> rare(K);
        for (int i = 0; i < K; i++) {
            cin >> rare[i].first >> rare[i].second;
            rare[i].first--;
            rare[i].second--;
        }
        vector<vector<int>> grid(N, vector<int>(N));
        for (int i = 0; i < N; i++)
            for (int j = 0; j < N; j++)
                cin >> grid[i][j];
        int answer = INF;
        // Try every road cell as research center
        for (int sr = 0; sr < N; sr++) {
            for (int sc = 0; sc < N; sc++) {
                if (grid[sr][sc] == 0)
                    continue;
                vector<vector<int>> dist(N, vector<int>(N, -1));
                queue<pair<int, int>> q;
                dist[sr][sc] = 0;
                q.push({sr, sc});
                while (!q.empty()) {
                    auto [x, y] = q.front();
                    q.pop();
                    for (int d = 0; d < 4; d++) {
                        int nx = x + dx[d];
                        int ny = y + dy[d];
                        if (nx < 0 || ny < 0 || nx >= N || ny >= N)
                            continue;
                        if (grid[nx][ny] == 0)
                            continue;
                        if (dist[nx][ny] != -1)
                            continue;
                        dist[nx][ny] = dist[x][y] + 1;
                        q.push({nx, ny});
                    }
                }

                int farthest = 0;
                bool possible = true;
                for (auto &cell : rare) {
                    int x = cell.first;
                    int y = cell.second;
                    if (dist[x][y] == -1) {
                        possible = false;
                        break;
                    }
                    farthest = max(farthest, dist[x][y]);
                }

                if (possible)
                    answer = min(answer, farthest);
            }
        }

        cout << answer << "\n";
    }

    return 0;
}