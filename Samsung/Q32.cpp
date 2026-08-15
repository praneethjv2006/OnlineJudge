/*
Minimum Cost to Reach Destination Using Wormholes
Problem Statement: 
A spaceship starts at a source coordinate (sx, sy) and wants to reach a destination coordinate (dx, dy).

The spaceship can:
Travel normally.
Use wormholes.

The cost of normal movement between two points is the Manhattan Distance:
|x1 - x2| + |y1 - y2|

There are N wormholes.
Each wormhole has:

Entry point (x1, y1)
Exit point (x2, y2)
Usage cost c

A wormhole is bidirectional, meaning:
You may enter at (x1, y1) and exit at (x2, y2).
Or enter at (x2, y2) and exit at (x1, y1).

A wormhole can be used at most once.
Find the minimum cost required to reach the destination.

It is allowed to not use any wormhole.

Input Format
First line contains T.
For each test case:
Integer N
sx sy dx dy
Next N lines:
x1 y1 x2 y2 cost
Output Format

For each test case print the minimum cost.

Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ 15
Coordinates are integers.
Wormholes are bidirectional.
A wormhole can be used at most once.
Example
Input
1
2
0 0 10 10
1 1 8 8 2
2 9 9 2 3
Output
6

(The exact answer depends on whether using wormholes is beneficial.)

Idea

At every step, we have two choices:

Go directly to the destination.
Use one of the unused wormholes.

We try every possible order of using wormholes and keep the minimum cost.

Since N is small (≤15), backtracking is feasible.

Algorithm

From the current position:

Update the answer assuming we go directly to the destination.
For every unused wormhole:
Mark it as used.
Enter from endpoint 1 and exit from endpoint 2.
Enter from endpoint 2 and exit from endpoint 1.
Recurse.
Unmark the wormhole.
*/


#include <bits/stdc++.h>
using namespace std;

struct Wormhole {
    int x1, y1;
    int x2, y2;
    int cost;
};

int n;
int answer;
vector<Wormhole> holes;
vector<int> used;

int distanceCost(int x1, int y1, int x2, int y2) {
    return abs(x1 - x2) + abs(y1 - y2);
}

void dfs(int curX, int curY, int destX, int destY, int currentCost) {
    // Go directly to destination
    answer = min(answer, currentCost + distanceCost(curX, curY, destX, destY));

    // Try every unused wormhole
    for (int i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = 1;
        // Enter from first end
        dfs(
            holes[i].x2,
            holes[i].y2,
            destX,
            destY,
            currentCost +
            distanceCost(curX, curY, holes[i].x1, holes[i].y1) +
            holes[i].cost
        );
        // Enter from second end
        dfs(
            holes[i].x1,
            holes[i].y1,
            destX,
            destY,
            currentCost +
            distanceCost(curX, curY, holes[i].x2, holes[i].y2) +
            holes[i].cost
        );
        used[i] = 0;
    }
}

int main() {
    int T;
    cin >> T;
    while (T--) {
        cin >> n;
        int sx, sy, dx, dy;
        cin >> sx >> sy >> dx >> dy;
        holes.resize(n);
        used.assign(n, 0);
        for (int i = 0; i < n; i++) {
            cin >> holes[i].x1
                >> holes[i].y1
                >> holes[i].x2
                >> holes[i].y2
                >> holes[i].cost;
        }

        answer = INT_MAX;
        dfs(sx, sy, dx, dy, 0);
        cout << answer << "\n";
    }

    return 0;
}