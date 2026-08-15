/*
Problem Statement

You are given:

A positive integer A (as a string because it can contain up to 100 digits).
An integer S (0 ≤ S ≤ 1000).

Find the number of integers from 1 to A (inclusive) whose sum of digits is exactly S.

Constraints
1 ≤ A < 10^100
0 ≤ S ≤ 1000
*/
#include<bits/stdc++.h>
using namespace std;

int solve(vector<vector<vector<int>>> &dp, int pos, int sum_left, bool tight, string &A){
    if(pos == A.size()) return sum_left == 0;
    if(sum_left < 0) return 0;
    if(dp[pos][sum_left][tight] != -1) return dp[pos][sum_left][tight];
    int limit = tight ? A[pos] - '0' : 9;
    int ways = 0;
    for(int i = 0;i<=limit; i++){
        bool new_tight = tight && (i == limit);
        ways+= solve(dp, pos + 1, sum_left - i, new_tight, A);
    }
    return dp[pos][sum_left][tight] = ways;
}

int main(){
    string A;
    int S;
    cin>>A>>S;
    vector<vector<vector<int>>> dp(A.size(), vector<vector<int>>(S + 1, vector<int>(2, -1)));
    cout<<solve(dp, 0, S, true, A)<<endl;
    return 0;
}