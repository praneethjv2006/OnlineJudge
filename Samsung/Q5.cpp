/*
Problem: You are given an undirected graph with N vertices represented by an adjacency matrix. 
Determine whether the graph is bipartite.

A graph is bipartite if its vertices can be divided into two sets such that no two adjacent vertices belong
 to the same set.

If the graph is bipartite, print any one of the two sets of vertices (all vertices having the same color). 
If the graph is not bipartite, print -1.

The graph may contain multiple disconnected components.
*/

#include <bits/stdc++.h>
using namespace std;

bool dfs(int node, vector<vector<int>> &graph, vector<int> &color, int n) {
    for (int next = 0; next < n; next++) {
        if (graph[node][next] == 0)
            continue;
        if (color[next] == -1) {
            color[next] = 1 - color[node];
            if (!dfs(next, graph, color, n))
                return false;
        }
        else if (color[next] == color[node]) {
            return false;
        }
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<int>> graph(n, vector<int>(n));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cin >> graph[i][j];
        }
    }
    vector<int> color(n, -1);
    for (int i = 0; i < n; i++) {
        if (color[i] != -1)
            continue;
        color[i] = 0;
        if (!dfs(i, graph, color, n)) {
            cout << -1;
            return 0;
        }
    }
    for (int i = 0; i < n; i++) {
        if (color[i] == 0)
            cout << i << " ";
    }

    return 0;
}