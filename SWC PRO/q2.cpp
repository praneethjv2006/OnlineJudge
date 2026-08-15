/*
Given an array where each element of the array represents garbage at index i.
Initially you can put any number of cleaner at any index. Cost of putting the cleaner is M.
each day the cost is equal to the sum of leftover garbage over the array.
on next day cleaner move to i+1 index.
cleaner can only move to its adjacent right index next day.
Find the minimum cost to clean the whole array.

for example we have an array of size 7
array = [3,4,7,10,4,3,2]
and M ( cost of cleaner ) = 10
so lets we put cleaner at index (0,2,3) initially
so initail cost = 10 + 10 + 10 = 30
on first day garbage left at indices (1,4,5,6) thus cost = 4+4+3+2 = 13
on second day cleaner move to i+1 index so garbage left at indices (5,6) thus cost = 3+2 =5
on third day cleaner move to there next indices on right thus garbage left at index (6) so cost = 2
on fourth day all the garbage is cleaned.

so total cost of cleaning = initial cost + cost of garbage left each day = 30 + 13 + 5 + 2 = 50.
*/
#include <bits/stdc++.h>
using namespace std;

int n, m;
vector<int> garbage;
vector<vector<long long>> dp;

long long solve(int idx, int lastCleaner){
    if(idx == n) return 0;
    if(dp[idx][lastCleaner] != -1) return dp[idx][lastCleaner];
    // Option 1: Place a new cleaner here
    long long placeCleaner = m + solve(idx + 1, idx);
    // Option 2: Let previous cleaner clean this position
    long long useOldCleaner = (long long)(idx - lastCleaner) * garbage[idx] + solve(idx + 1, lastCleaner);
    return dp[idx][lastCleaner] = min(placeCleaner, useOldCleaner);
}

int main(){
    cin >> n >> m;
    garbage.resize(n);
    for(int i = 0; i < n; i++) cin >> garbage[i];
    dp.assign(n, vector<long long>(n, -1));
    cout << m + solve(1, 0);
    return 0;
}

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> garbage(n);
    for (int i = 0; i < n; i++) cin >> garbage[i];
    vector<vector<long long>> dp(n + 1, vector<long long>(n + 1, 0));
    // Base case: dp[n][*] = 0
    for (int index = n - 1; index >= 1; index--) {
        for (int prev = index - 1; prev >= 0; prev--) {
            long long startCleaner = m + dp[index + 1][index];
            long long continueCleaner = (long long)(index - prev) * garbage[index] + dp[index + 1][prev];
            dp[index][prev] = min(startCleaner, continueCleaner);
        }
    }

    cout << m + dp[1][0] << '\n';

    return 0;
}