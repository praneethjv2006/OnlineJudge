/*
Maximum Square Plot with At Most One Sinkhole
Problem Statement: A rectangular plot of land is represented as an N × M grid.
Some cells contain sinkholes. A sinkhole is represented by its coordinates.
You want to select the largest possible square plot such that it contains at most one sinkhole.
If multiple squares have the same maximum area:

Choose the one with fewer sinkholes.
If there is still a tie, output any one of them.
For the selected square, print its:
Bottom-left coordinate (xb, yb)
Top-right coordinate (xt, yt)

The grid is 1-indexed, where (1,1) is the top-left cell.

Input Format:
First line contains two integers N and M.
Second line contains an integer K, the number of sinkholes.
Next K lines contain two integers x y, representing the coordinates of a sinkhole.

Output Format:
Print four integers
xb yb xt yt
where
(xb, yb) = bottom-left corner
(xt, yt) = top-right corner
of the largest valid square.

Constraints:
1 ≤ N, M ≤ 1000
1 ≤ K ≤ N + M
Grid coordinates are 1-indexed.
A sinkhole occupies exactly one cell.
Example
Input
5 5
2
2 2
4 4

One possible answer
5 1 2 4
(The exact coordinates may vary if multiple optimal squares exist.)
*/

#include <bits/stdc++.h>
using namespace std;

int xb, yb, xt, yt;

// Checks whether a square of side 'len' exists
// having at most one sinkhole.
bool check(int len, int N, int M, vector<vector<int>> &pref) {
    int bestSinkholes = 2;   // We only care about 0 or 1
    bool found = false;
    for (int r = 1; r + len - 1 <= N; r++) {
        for (int c = 1; c + len - 1 <= M; c++) {
            int r2 = r + len - 1;
            int c2 = c + len - 1;
            int sinkholes = pref[r2][c2]- pref[r - 1][c2]- pref[r2][c - 1]+ pref[r - 1][c - 1];
            if (sinkholes <= 1) {
                if (sinkholes < bestSinkholes) {
                    bestSinkholes = sinkholes;
                    // Bottom-left
                    xb = r2;
                    yb = c;
                    // Top-right
                    xt = r;
                    yt = c2;
                }
            }
        }
    }

    return bestSinkholes <= 1;
}

int main() {

    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N, M;
    cin >> N >> M;

    vector<vector<int>> grid(N + 1, vector<int>(M + 1, 0));

    int K;
    cin >> K;

    while (K--) {
        int x, y;
        cin >> x >> y;
        grid[x][y] = 1;
    }

    // Prefix Sum
    vector<vector<int>> pref(N + 1, vector<int>(M + 1, 0));

    for (int i = 1; i <= N; i++) {
        for (int j = 1; j <= M; j++) {

            pref[i][j] =
                grid[i][j]
                + pref[i - 1][j]
                + pref[i][j - 1]
                - pref[i - 1][j - 1];
        }
    }

    int low = 1;
    int high = min(N, M);

    while (low <= high) {

        int mid = (low + high) / 2;

        if (check(mid, N, M, pref)) {
            low = mid + 1;      // Try larger square
        } else {
            high = mid - 1;     // Reduce size
        }
    }

    cout << xb << " " << yb << " " << xt << " " << yt << "\n";

    return 0;
}