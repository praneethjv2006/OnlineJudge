/*
Problem:
You are given N balloons arranged in a line. Each balloon has a positive integer value.
When you burst the i-th balloon, you earn:
left × current × right

where:
left is the value of the nearest unburst balloon to the left (or 1 if none exists).
current is the value of the balloon being burst.
right is the value of the nearest unburst balloon to the right (or 1 if none exists).

After bursting a balloon, it is removed, and its neighboring balloons become adjacent.
Your task is to determine the maximum coins that can be collected by bursting all the balloons in the optimal order.

Input:
The first line contains an integer N — the number of balloons.
The second line contains N integers representing the balloon values.

Output:
Print a single integer representing the maximum coins that can be collected.

Constraints
1 ≤ N ≤ 300
1 ≤ balloon[i] ≤ 100
*/

#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> balloon(n);
    for (int i = 0; i < n; i++)cin >> balloon[i];
    vector<vector<int>> dp(n, vector<int>(n, 0));
    // length of interval
    for (int len = 1; len <= n; len++) {
        for (int left = 0; left + len - 1 < n; left++) {
            int right = left + len - 1;
            for (int last = left; last <= right; last++) {
                int leftValue = (left == 0) ? 1 : balloon[left - 1];
                int rightValue = (right == n - 1) ? 1 : balloon[right + 1];
                int leftCoins = 0;
                int rightCoins = 0;

                if (last > left)  leftCoins = dp[left][last - 1];
                if (last < right) rightCoins = dp[last + 1][right];

                int currentCoins = leftValue * balloon[last] * rightValue;

                dp[left][right] = max(dp[left][right], leftCoins + rightCoins + currentCoins);
            }
        }
    }

    cout << dp[0][n - 1];

    return 0;
}