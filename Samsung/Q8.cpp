/*
Problem:
You are given an N × M chessboard. A mobile piece moves exactly like a Knight in chess.
The Knight can move in any of the following 8 directions:
(-2,+1) (-1,+2) (+1,+2) (+2,+1)
(+2,-1) (+1,-2) (-1,-2) (-2,-1)
Given the starting position of the Knight and the position of a stationary piece, find the minimum number of 
moves required for the Knight to capture the stationary piece.
If it is impossible to reach the destination, print -1.

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains two integers N and M — the number of rows and columns.
The second line contains four integers:
R C — starting position of the Knight.
S K — position of the stationary piece.
Positions are 1-indexed.

Output:
For each test case print
Case #x
minimumMoves
where x is the test case number.
*/

#include <bits/stdc++.h>
using namespace std;

struct Node {
    int row;
    int col;
    int moves;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    vector<pair<int,int>> direction = {
        {-2, 1}, {-1, 2},
        { 1, 2}, { 2, 1},
        { 2,-1}, { 1,-2},
        {-1,-2}, {-2,-1}
    };

    for (int tc = 1; tc <= T; tc++) {
        int n, m;
        cin >> n >> m;
        int startRow, startCol;
        int endRow, endCol;
        cin >> startRow >> startCol >> endRow >> endCol;

        vector<vector<int>> visited(n + 1, vector<int>(m + 1, 0));
        queue<Node> q;

        q.push({startRow, startCol, 0});
        visited[startRow][startCol] = 1;
        int answer = -1;

        while (!q.empty()) {
            Node cur = q.front();
            q.pop();
            if (cur.row == endRow && cur.col == endCol) {
                answer = cur.moves;
                break;
            }

            for (auto move : direction) {
                int newRow = cur.row + move.first;
                int newCol = cur.col + move.second;
                if (newRow >= 1 && newRow <= n &&newCol >= 1 && newCol <= m &&!visited[newRow][newCol]) {
                    visited[newRow][newCol] = 1;
                    q.push({newRow,newCol,cur.moves + 1});
                }
            }
        }
        cout << "Case #" << tc << "\n";
        cout << answer << "\n";
    }

    return 0;
}