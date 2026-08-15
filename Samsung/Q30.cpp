/*
Maximum Rows with All 1's After K Column Flips
Problem Statement:  You are given a binary matrix of size N × M containing only 0s and 1s.
In one operation, you may toggle (flip) any one column:
0 → 1   1 → 0
You can perform exactly K column flips.
A column may be flipped multiple times.
Your task is to determine the maximum number of rows that can become entirely filled with 1s after performing exactly K flips.

Input Format:
First line contains an integer T — number of test cases.
For each test case:
Two integers N and M.
An integer K.
N lines follow, each containing M binary values.
Output Format

For each test case print
#case_number answer
where answer is the maximum number of rows consisting entirely of 1s.
Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ 100
1 ≤ M ≤ 15 (small enough for combinations)
0 ≤ K ≤ 100
Example 1
Input
1
3 3
2
1 0 0
1 0 1
1 0 0
Output
#1 2
Explanation

Flip columns 2 and 3 once.

The matrix becomes

1 1 1
1 1 0
1 1 1

Rows 1 and 3 become all 1s.

Answer = 2

Key Observation
Flipping the same column twice cancels its effect.
Therefore, only the parity (odd/even) of the number of flips on each column matters.

If
K is even → only even-sized sets of columns are useful.
K is odd → only odd-sized sets are useful.

This greatly reduces the number of combinations that need to be checked.

Approach:
Store the original matrix.
Generate all valid combinations of columns.
Flip those columns.
Count rows containing all 1s.
Restore the matrix.
Keep the maximum answer.
*/

#include <bits/stdc++.h>
using namespace std;

const int MAX = 105;
int grid[MAX][MAX];
int original[MAX][MAX];
int bestAnswer;

// Restore original matrix
void restoreMatrix(int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            grid[i][j] = original[i][j];
}
// Flip one column
void flipColumn(int rows, int col) {
    for (int i = 0; i < rows; i++)
        grid[i][col] ^= 1;
}
// Count rows having all 1's
int countAllOneRows(int rows, int cols) {
    int count = 0;
    for (int i = 0; i < rows; i++) {
        bool ok = true;
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == 0) {
                ok = false;
                break;
            }
        }
        if (ok)
            count++;
    }

    return count;
}

// Generate combinations
void generateCombinations(vector<int> &columns,vector<int> &chosen,int index, int need, int rows, int cols) {
    if (chosen.size() == need) {
        for (int col : chosen)
            flipColumn(rows, col);
        bestAnswer = max(bestAnswer, countAllOneRows(rows, cols));
        restoreMatrix(rows, cols);
        return;
    }

    if (index == columns.size())
        return;

    chosen.push_back(columns[index]);
    generateCombinations(columns, chosen, index + 1,
                         need, rows, cols);
    chosen.pop_back();

    generateCombinations(columns, chosen, index + 1,
                         need, rows, cols);
}

int main() {

    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T;
    cin >> T;

    for (int tc = 1; tc <= T; tc++) {

        int rows, cols;
        cin >> rows >> cols;

        int K;
        cin >> K;

        vector<int> columns(cols);

        for (int i = 0; i < cols; i++)
            columns[i] = i;

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                cin >> grid[i][j];
                original[i][j] = grid[i][j];
            }
        }
        bestAnswer = countAllOneRows(rows, cols);
        vector<int> chosen;
        int limit = min(K, cols);
        int start = (K % 2 == 0) ? 2 : 1;
        for (int len = start; len <= limit; len += 2) {
            generateCombinations(columns,chosen,0,len,rows,cols);
            restoreMatrix(rows, cols);
        }

        cout << "#" << tc << " " << bestAnswer << "\n";
    }

    return 0;
}