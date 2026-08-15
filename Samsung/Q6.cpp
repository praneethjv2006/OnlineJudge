/*
Problem: You are given N balloons arranged in a line. Each balloon has an integer value.
You have exactly N bullets and must burst all the balloons.
When you burst a balloon, the points earned are:

If both left and right balloons exist, points = left × right.
If only the left balloon exists, points = left.
If only the right balloon exists, points = right.
If it is the last remaining balloon, points = its own value.

After a balloon is burst, it is removed from the line, and its neighboring balloons become adjacent.
Find the maximum total points that can be earned by bursting the balloons in the best possible order.

Input:
The first line contains an integer N — number of balloons.
The second line contains N integers representing the values of the balloons.

Output:
Print a single integer representing the maximum points that can be obtained.

Constraints
1 ≤ N ≤ 300
0 ≤ balloon[i] ≤ 100
*/


#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    vector<int> nums;
    nums.push_back(1);
    int extraPoints = 0;
    // Remove zero balloons first
    for (int i = 0; i < n; i++) {
        if (arr[i] != 0) {
            nums.push_back(arr[i]);
        }
        else {
            int left = (nums.size() > 1) ? nums.back() : 1;
            int right = (i + 1 < n) ? arr[i + 1] : 1;
            extraPoints += left * right;
        }
    }
    nums.push_back(1);
    int m = nums.size();
    vector<vector<int>> dp(m, vector<int>(m, 0));
    // gap = right - left
    for (int gap = 2; gap < m; gap++) {
        for (int left = 0; left + gap < m; left++) {
            int right = left + gap;
            for (int last = left + 1; last < right; last++) {
                int gain;
                // Last balloon of the whole array
                if (left == 0 && right == m - 1) gain = nums[left] * nums[last] * nums[right];
                else gain = nums[left] * nums[right];

                dp[left][right] = max(dp[left][right], dp[left][last] +dp[last][right] +gain);
            }
        }
    }

    cout << extraPoints + dp[0][m - 1];

    return 0;
}