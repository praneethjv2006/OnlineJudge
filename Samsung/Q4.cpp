/*
Problem:There are M oil mines arranged in a circular island, and each mine contains a certain amount of oil. 
You need to distribute all the oil mines among N companies such that:

Each company receives one contiguous group of oil mines.
Every oil mine is assigned to exactly one company.
Since the mines are arranged in a circle, a company's assigned group may wrap around from the last mine to the first.

After distributing the mines, let:
maximumOil = total oil received by the company with the most oil.
minimumOil = total oil received by the company with the least oil.
Your task is to minimize the difference: maximumOil - minimumOil

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains two integers N and M.
N = number of companies.
M = number of oil mines.
The second line contains M integers, where the i-th integer represents the amount of oil in the i-th mine.
Output

For each test case, print a single integer representing the minimum possible difference between the company
with the maximum total oil and the company with the minimum total oil.

Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ M
1 ≤ M ≤ 20 (small enough for backtracking)
1 ≤ oil[i] ≤ 10^5
Every company must receive at least one oil mine.
Each company's mines must form a contiguous segment in the circular arrangement.
*/

#include <bits/stdc++.h>
using namespace std;

int companies, mines;
int answer;
void dfs(int idx, int start,vector<int> &oil,vector<bool> &visited,
    int groupsUsed,int currentSum,int minSum,int maxSum) {
    // Completed one full circle
    if (visited[idx]) {
        minSum = min(minSum, currentSum);
        maxSum = max(maxSum, currentSum);
        if (groupsUsed == companies - 1)answer = min(answer, maxSum - minSum);
        return;
    }
    visited[idx] = true;
    int next = (idx + 1) % mines;
    // Continue current company
    dfs(next,start,oil,visited,groupsUsed,currentSum + oil[idx],minSum,maxSum);
    // Start a new company after this mine
    if (groupsUsed < companies - 1) {
        int newMin = min(minSum, currentSum);
        int newMax = max(maxSum, currentSum);
        dfs(next,start,oil,visited,groupsUsed + 1,oil[idx],newMin,newMax);
    }
    visited[idx] = false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        cin >> companies >> mines;
        vector<int> oil(mines);
        for (int i = 0; i < mines; i++)cin >> oil[i];
        answer = INT_MAX;
        // Try every mine as starting point
        for (int start = 0; start < mines; start++) {
            vector<bool> visited(mines, false);
            dfs(start,start,oil,visited,0,0,INT_MAX,INT_MIN);
        }
        cout << answer << "\n";
    }
    return 0;
}