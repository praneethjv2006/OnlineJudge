/*
Tree Collection Robot
Problem Statement: A straight road consists of positions from 0 to N.
At every position 1...N-1, there can be:
at most one tree on the left side
at most one tree on the right side

Each tree has a positive integer height.
A robot starts at position 0 and must cut every tree and finally reach position N.

Rules:
Cutting one tree costs 1.
Moving d units costs d.
The robot can carry any number of trees.
The carried trees must always form a non-increasing stack (bottom to top).
If the current top tree has height H, the next picked tree must have height ≤ H.
Equal heights are allowed.
The robot finishes only after delivering all trees at position N.

Find the minimum total cost.

Input Format
First line contains T.
For each test case:
Integer N
Array left[]
Array right[]

0 means no tree.

Output Format

Print

#case_number minimum_cost
Constraints
5 ≤ N ≤ 1000
1 ≤ Height ≤ 1000
At most one tree on each side of every position.
Example
Input
1
5
0 3 2 1 0
0 3 2 1 0
Output
#1 11
Key Observation

The robot can only place a tree on the stack if its height is not greater than the current top.

Therefore,

All trees of height 1000 must be collected before height 999, before height 998, and so on.

So we process heights from largest to smallest.

DP State

Let

dp[h][pos]

be

Minimum movement cost required to collect all trees having height ≤ h, when the robot is currently standing at position pos.

Transition

For every height:

Suppose all trees of this height lie between

L ............. R

There are three cases.

Algorithm
Store all positions according to their height.
Sort positions of every height.
Process heights from 1000 to 1.
Use DP to find minimum movement.
Add cutting cost automatically (each tree contributes 1).
*/

#include <bits/stdc++.h>
using namespace std;

const int MAX_HEIGHT = 1000;

int n;
int dp[1001][1001];

int solve(vector<vector<int>> &trees, int height, int pos) {
    // All heights processed
    if (height == 0) return n - pos;
    if (dp[height][pos] != -1) return dp[height][pos];
    // No tree of this height
    if (trees[height].empty())  return dp[height][pos] = solve(trees, height - 1, pos);
    vector<int> &positions = trees[height];
    int leftMost = positions.front();
    int rightMost = positions.back();
    int treeCount = positions.size();
    int answer = INT_MAX;
    // Current position is left of all trees
    if (pos < leftMost) {
        int move = rightMost - pos;
        answer = treeCount + move + solve(trees, height - 1, rightMost);
    }
    // Current position is right of all trees
    else if (pos > rightMost) {
        int move = pos - leftMost;
        answer = treeCount + move + solve(trees, height - 1, leftMost);
    }
    // Current position lies between leftMost and rightMost
    else {
            int goLeft =
            (pos - leftMost) +
            (rightMost - leftMost) +
            treeCount +
            solve(trees, height - 1, rightMost);
        int goRight =
            (rightMost - pos) +
            (rightMost - leftMost) +
            treeCount +
            solve(trees, height - 1, leftMost);

        answer = min(goLeft, goRight);
    }
    return dp[height][pos] = answer;
}

int main() {
    int T;
    cin >> T;
    while (T--) {
        cin >> n;
        vector<vector<int>> trees(MAX_HEIGHT + 1);
        memset(dp, -1, sizeof(dp));
        for (int i = 0; i < n; i++) {
            int h;
            cin >> h;
            if (h)
                trees[h].push_back(i);
        }
        for (int i = 0; i < n; i++) {
            int h;
            cin >> h;
            if (h)
                trees[h].push_back(i);
        }
        for (int h = 1; h <= MAX_HEIGHT; h++)
            sort(trees[h].begin(), trees[h].end());

        cout << solve(trees, MAX_HEIGHT, 0) << "\n";
    }
}