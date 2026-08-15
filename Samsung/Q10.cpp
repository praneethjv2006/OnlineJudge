/*
Problem:
You are given a directed graph with N vertices and M directed edges.
Determine whether the graph contains at least one cycle.
If a cycle exists, print the vertices belonging to any one cycle. 
Otherwise, print 0 (or false, depending on the required output).

Input:
The first line contains an integer N — number of vertices.
The second line contains an integer M — number of directed edges.
The next M lines each contain two integers u and v, representing a directed edge from u to v.

Output:
If the graph contains a cycle:
Print 1 (or true) and the vertices of any one cycle.
Otherwise print:
0
*/

#include <bits/stdc++.h>
using namespace std;

bool dfs(int node, vector<vector<int>> &graph, vector<int> &visited, vector<int> &pathVisited) {
    visited[node] = 1;
    pathVisited[node] = 1;
    for (int next : graph[node]) {
        if (!visited[next]) {
            if (dfs(next, graph, visited, pathVisited)) return true;
        }
        else if (pathVisited[next]) {
            return true;
        }
    }
    pathVisited[node] = 0;
    return false;
}

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
    }
    vector<int> visited(n, 0);
    vector<int> pathVisited(n, 0);
    bool cycle = false;

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            if (dfs(i, graph, visited, pathVisited)) {
                cycle = true;
                break;
            }
        }
    }

    cout << cycle;

    return 0;
}


// print the vertices of any one cycle

#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> graph;
vector<int> visited, pathVisited, parent;
vector<int> cycle;
bool dfs(int node) {
    visited[node] = 1;
    pathVisited[node] = 1;

    for (int next : graph[node]) {
        if (!visited[next]) {
            parent[next] = node;
            if (dfs(next)) return true;
        }
        else if (pathVisited[next]) {
            // Found a cycle
            cycle.push_back(next);
            int cur = node;
            while (cur != next) {
                cycle.push_back(cur);
                cur = parent[cur];
            }
            cycle.push_back(next);
            reverse(cycle.begin(), cycle.end());
            return true;
        }
    }
    pathVisited[node] = 0;
    return false;
}

int main() {
    int n, m;
    cin >> n >> m;
    graph.resize(n);
    visited.assign(n, 0);
    pathVisited.assign(n, 0);
    parent.assign(n, -1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
    }

    bool found = false;
    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            if (dfs(i)) {
                found = true;
                break;
            }
        }
    }

    if (!found) {
        cout << 0;
    }
    else {
        cout << 1 << "\n";
        for (int node : cycle)
            cout << node << " ";
    }

    return 0;
}