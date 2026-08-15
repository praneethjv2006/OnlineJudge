/*
You are given a limited number of CPUs, Memory Chips, and Boards. 
There are N computer configurations, where each configuration specifies the resources required to build 
one computer and its selling price. You may manufacture any number of computers using a configuration,
but you can use at most 3 different configurations. After manufacturing, any remaining CPUs and Memory Chips
can be sold individually at their given prices, while Boards have no resale value. 
Find the maximum total revenue.

Input
First line contains an integer T — number of test cases.
For each test case:
One line contains D E F d e
D = available CPUs
E = available Memory Chips
F = available Boards
d = selling price of one CPU
e = selling price of one Memory Chip
One line contains an integer N — number of computer configurations.
Next N lines each contain Di Ei Fi SPi:
Di = CPUs required
Ei = Memory Chips required
Fi = Boards required
SPi = selling price of one computer
*/


#include <bits/stdc++.h>
using namespace std;

struct Config {int cpu, chip, board, price;};
int D, E, F;
int cpuPrice, chipPrice;
int N;
vector<Config> cfg;
int answer;

void dfs(int idx, int usedConfigs, int cpuLeft, int chipLeft, int boardLeft, int profit) {
    // No more configurations or already used 3 different configurations
    if (idx == N || usedConfigs == 3) {
        profit += cpuLeft * cpuPrice;
        profit += chipLeft * chipPrice;
        answer = max(answer, profit);
        return;
    }
    // Option 1: Skip this configuration
    dfs(idx + 1, usedConfigs, cpuLeft, chipLeft, boardLeft, profit);
    // Option 2: Use this configuration one or more times
    int maxBuild = min({cpuLeft / cfg[idx].cpu,chipLeft / cfg[idx].chip,boardLeft / cfg[idx].board});
    for (int cnt = 1; cnt <= maxBuild; cnt++) {
        dfs(
            idx + 1,
            usedConfigs + 1,
            cpuLeft - cnt * cfg[idx].cpu,
            chipLeft - cnt * cfg[idx].chip,
            boardLeft - cnt * cfg[idx].board,
            profit + cnt * cfg[idx].price
        );
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; tc++) {
        cin >> D >> E >> F >> cpuPrice >> chipPrice;
        cin >> N;
        cfg.resize(N);
        for (int i = 0; i < N; i++) {cin >> cfg[i].cpu>> cfg[i].chip>> cfg[i].board>> cfg[i].price;}
        answer = 0;
        dfs(0, 0, D, E, F, 0);
        cout << "Case #" << tc << "\n";
        cout << answer << "\n";
    }
    return 0;
}