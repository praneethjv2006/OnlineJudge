/*
Problem:
You are given an undirected graph with N vertices and M edges.
Determine whether the graph contains a cycle.
If a cycle exists, print the vertices belonging to any one cycle. If no cycle exists, print -1.

Input:
The first line contains two integers N and M.
N = number of vertices.
M = number of edges.
The next M lines each contain two integers u and v, representing an undirected edge between vertices u and v.

Output:
If a cycle exists, print the vertices of any one cycle.
Otherwise print:
-1

Constraints:
1 ≤ N ≤ 100
0 ≤ M ≤ N(N−1)/2
Vertices are numbered from 0 to N−1.
*/

#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> graph;
vector<int> visited;
vector<int> cycle;
vector<int> parentArr;

bool dfs(int node, int parent) {
    visited[node] = 1;
    parentArr[node] = parent;
    for (int next : graph[node]) {
        if (!visited[next]) {
            if (dfs(next, node))return true;
        }
        else if (next != parent) {
            cycle.push_back(next);
            int cur = node;
            while (cur != next) {
                cycle.push_back(cur);
                cur = parentArr[cur];
            }
            cycle.push_back(next);
            reverse(cycle.begin(), cycle.end());
            return true;
        }
    }

    return false;
}

int main() {
    int n, m;
    cin >> n >> m;
    graph.resize(n);
    visited.assign(n, 0);
    parentArr.assign(n, -1);

    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }

    bool found = false;
    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            if (dfs(i, -1)) {
                found = true;
                break;
            }
        }
    }

    if (!found)
        cout << -1;
    else {

        for (int node : cycle)
            cout << node << " ";
    }

    return 0;
}

