/*
Problem: You are given N positions on a straight line where cows can be placed and an integer K 
representing the number of cows. Place all K cows in the given positions such that the minimum distance 
between any two cows is as large as possible. Return this maximum possible minimum distance.

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains two integers N and K.
N = number of available positions.
K = number of cows.
The second line contains N integers representing the available positions.

Output:
For each test case, print a single integer representing the maximum possible minimum distance between any two cows.

Constraints:
1 ≤ T ≤ 10
2 ≤ N ≤ 100000
2 ≤ K ≤ N
0 ≤ position[i] ≤ 10^9

Input
1
5 3
1 3 5 8 10
Output
4  (place at 1 5 10)
*/

#include <bits/stdc++.h>
using namespace std;

bool canPlaceCows(vector<int> &pos, int cows, int minDist) {
    int placed = 1;
    int lastPos = pos[0];
    for (int i = 1; i < pos.size(); i++) {
        if (pos[i] - lastPos >= minDist) {
            placed++;
            lastPos = pos[i];
            if (placed == cows)
                return true;
        }
    }
    return false;
}

pair<int, int> bin_search(vector<int> &pos, int cows) {
    sort(pos.begin(), pos.end());
    int l = 0;                                   // Last true
    int r = pos.back() - pos.front() + 1;        // First false
    while (r - l > 1) {
        int mid = l + (r - l) / 2;
        if (canPlaceCows(pos, cows, mid)) l = mid;
        else r = mid;
    }
    return {l, r};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int N, K;
        cin >> N >> K;
        vector<int> positions(N);
        for (int i = 0; i < N; i++)
            cin >> positions[i];
        auto ans = bin_search(positions, K);
        cout << ans.first << "\n";
    }

    return 0;
}