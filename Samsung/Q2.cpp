/*
Problem: You are given an N × N square paper (N = 2^K) where each cell is either:
0 → White, 1 → Blue
If a paper consists entirely of the same color, keep it as one piece.
Otherwise, divide it into four equal square pieces by cutting it horizontally and vertically through the middle. 
Repeat this process for each sub-square until every remaining piece contains only one color.
Your task is to determine the total number of white paper pieces and blue paper pieces after all divisions are completed.

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains an integer N — size of the paper (N × N).
The next N lines each contain N integers (0 or 1), representing the colors of the paper.

Output:
For each test case, print:
Case #x
whitePieces bluePieces

where:
x is the test case number (starting from 1).
whitePieces is the total number of white paper pieces.
bluePieces is the total number of blue paper pieces.
Constraints
1 ≤ T ≤ 30
N = 2^K, where 1 ≤ K ≤ 7
2 ≤ N ≤ 128
Each cell contains either 0 (white) or 1 (blue).
*/

#include <bits/stdc++.h>
using namespace std;

int whitePieces, bluePieces;
bool sameColor(vector<vector<int>> &paper, int row, int col, int size) {
    int color = paper[row][col];
    for (int i = row; i < row + size; i++) {
        for (int j = col; j < col + size; j++) {
            if (paper[i][j] != color)
                return false;
        }
    }
    return true;
}

void divide(vector<vector<int>> &paper, int row, int col, int size) {
    // Entire square has one color
    if (sameColor(paper, row, col, size)) {
        if (paper[row][col] == 0)
            whitePieces++;
        else
            bluePieces++;
        return;
    }
    int half = size / 2;
    // Top Left
    divide(paper, row, col, half);
    // Top Right
    divide(paper, row, col + half, half);
    // Bottom Left
    divide(paper, row + half, col, half);
    // Bottom Right
    divide(paper, row + half, col + half, half);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; tc++) {
        int N;
        cin >> N;
        vector<vector<int>> paper(N, vector<int>(N));
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                cin >> paper[i][j];
            }
        }
        whitePieces = 0;
        bluePieces = 0;
        divide(paper, 0, 0, N);
        cout << "Case #" << tc << "\n";
        cout << whitePieces << " " << bluePieces << "\n";
    }

    return 0;
}