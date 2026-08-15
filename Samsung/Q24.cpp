/*
Equal Height Pillars for Maximum Banner Height (Samsung)
Problem Statement: A company wants to place an electronic banner on top of two pillars.

You are given the heights of N available pillars. Each pillar can be used at most once.

Your task is to divide the pillars into two groups such that:
Both groups have equal total height.
The common height is as large as possible.

If it is impossible to construct two pillars of equal height, print 0.

Input Format

The first line contains an integer:

T

Number of test cases.
For each test case:

First line contains an integer:
N
Second line contains N integers representing pillar heights.
Output Format

For each test case print a single integer — the maximum possible equal height of the two pillars.
If no such partition exists, print 0.

Sample Input
1
5
1 2 3 4 6
Sample Output
8
Explanation

One possible partition is:

First pillar

6 + 2 = 8

Second pillar

4 + 3 + 1 = 8

Both pillars have height 8, which is the maximum possible.

Constraints

Typical Samsung constraints:

1 ≤ T ≤ 10

1 ≤ N ≤ 20

1 ≤ Height[i] ≤ 100
*/


#include <bits/stdc++.h>
using namespace std;

int main(){
    int T;
    cin >> T;
    while (T--){
        int n;
        cin >> n;
        vector<int> rods(n);
        int sum = 0;
        for (int i = 0; i < n; i++){
            cin >> rods[i];
            sum += rods[i];
        }
        vector<int> dp(sum + 1, -1);
        dp[0] = 0;
        for (int rod : rods){
            vector<int> next = dp;
            for (int diff = 0; diff <= sum - rod; diff++){
                if (dp[diff] == -1) continue;
                // Put rod on taller pillar
                next[diff + rod] = max(next[diff + rod], dp[diff]);
                // Put rod on shorter pillar
                int newDiff = abs(diff - rod);
                next[newDiff] = max(next[newDiff], dp[diff] + min(diff, rod));
            }
            dp = next;
        }

        cout << max(0, dp[0]) << "\n";
    }

    return 0;
}