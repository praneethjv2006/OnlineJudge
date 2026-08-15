/*
Problem: A runner has to complete a marathon of D km.
The runner starts with H units of energy.

There are 5 possible paces. For each pace you are given:
Time required to run 1 km (minutes, seconds)
Energy consumed per km

The runner may change pace after every kilometer.
Find the minimum time required to complete the marathon without exceeding the available energy.

It is guaranteed that at least one valid combination exists.

Input
First line: T
For each test case:
D H
Next 5 lines:
M S E
M = minutes per km
S = seconds per km
E = energy consumed per km

Output
For every test case print
#caseNumber minutes seconds
*/

#include <bits/stdc++.h>
using namespace std;

const int INF = 1e9;

struct Pace { int time; int energy;};

int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; tc++) {
        int D, H;
        cin >> D >> H;
        Pace pace[5];
        for (int i = 0; i < 5; i++) {
            int m, s, e;
            cin >> m >> s >> e;
            pace[i].time = m * 60 + s;
            pace[i].energy = e;
        }
        vector<vector<vector<int>>> dp( 6, vector<vector<int>>(D + 1, vector<int>(H + 1, INF)));
        dp[0][0][0] = 0;
        for (int i = 0; i < 5; i++) {
            for (int dist = 0; dist <= D; dist++) {
                for (int energy = 0; energy <= H; energy++) {
                    if (dp[i][dist][energy] == INF) continue;
                    for (int km = 0; dist + km <= D; km++) {
                        int newEnergy = energy + km * pace[i].energy;
                        if (newEnergy > H) break;
                        int newDist = dist + km;
                        dp[i + 1][newDist][newEnergy] = min(dp[i + 1][newDist][newEnergy],dp[i][dist][energy] +
                                km * pace[i].time);
                    }
                }
            }
        }

        int ans = INF;

        for (int energy = 0; energy <= H; energy++)
            ans = min(ans, dp[5][D][energy]);

        cout << "#" << tc << " "
             << ans / 60 << " "
             << ans % 60 << "\n";
    }

    return 0;
}