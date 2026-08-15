/*

*/

#include <bits/stdc++.h>
using namespace std;

struct Node {
    int x, y;
};

int manhattan(Node *a, Node *b) {
    return abs(a->x - b->x) + abs(a->y - b->y);
}

int main() {

    int T;
    cin >> T;
    for (int tc = 1; tc <= T; tc++) {
        int wormholes;
        cin >> wormholes;

        int totalNodes = 2 * wormholes + 2;

        vector<Node*> points(totalNodes);
        vector<vector<int>> cost(totalNodes, vector<int>(totalNodes));
        // Source
        points[0] = new Node();
        cin >> points[0]->x >> points[0]->y;
        // Destination
        points[totalNodes - 1] = new Node();
        cin >> points[totalNodes - 1]->x
            >> points[totalNodes - 1]->y;
        // Wormholes
        for (int i = 0; i < wormholes; i++) {

            Node *a = new Node();
            Node *b = new Node();
            int w;
            cin >> a->x >> a->y
                >> b->x >> b->y
                >> w;

            points[2 * i + 1] = a;
            points[2 * i + 2] = b;

            cost[2 * i + 1][2 * i + 2] = w;
            cost[2 * i + 2][2 * i + 1] = w;
        }

        // Initialize Manhattan distances
        for (int i = 0; i < totalNodes; i++) {

            for (int j = 0; j < totalNodes; j++) {

                if (i == j)
                    cost[i][j] = 0;

                else if (cost[i][j] == 0)
                    cost[i][j] = manhattan(points[i], points[j]);
            }
        }

        // Floyd-Warshall
        for (int k = 0; k < totalNodes; k++) {
            for (int i = 0; i < totalNodes; i++) {
                for (int j = 0; j < totalNodes; j++) {
                    cost[i][j] = min(cost[i][j], cost[i][k] + cost[k][j]);
                }
            }
        }

        cout << "#" << tc << " " << cost[0][totalNodes - 1] << "\n";
    }

    return 0;
}