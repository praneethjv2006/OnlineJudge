/*
Given a tree with n vertices, where each vertex has a number ai
written on it. Distance between two vertices is defined as the number of
edges on the path between them. You have to choose a vertex v such that
d1 × a1 + d2 × a2 + d3 × a3 + ... ... + dn × an is maximized,
where di denotes the distance between vertex i and vertex v.
You have to print this maximum value.

Input
The first line contains one integer n, the number of vertices in the tree (1≤n≤2⋅105).

The second line of the input contains n integers a1,a2,…,an(1≤ai≤2*10^5), where ai is the value of the vertex i.

Each of the next n−1 lines describes an edge of the tree. Edge i is denoted by two integers ui and vi,
the labels of vertices it connects (1≤ui,vi≤n, ui≠vi).

It is guaranteed that the given edges form a tree.

Output
Print one integer — the maximum possible cost of the tree if you can choose any vertex as v.


Example:

8
9 4 1 7 10 1 6 5
1 2
2 3
1 4
1 5
5 6
5 7
5 8

Output: 121

1
1337

Output: 0
*/

#include<iostream>
#include<bits/stdc++.h>
#define MAXN (2 * 100 * 1000) + 5
using namespace std;

long long total, a[MAXN], sum[MAXN], subtotal[MAXN];
long long ans = 0;
vector<vector<int>> edge(MAXN);

int DFS(int u, int previous)
{
  subtotal[u] = (long long)0;
  sum[u] = a[u];

  for(int &v : edge[u])
  {
    if(v != previous)
    {
      DFS(v, u);
      sum[u] += sum[v];
      subtotal[u] += subtotal[v] + sum[v];
    }
  }
}

int DFS2(int u, int prev, long long up)
{
  long long curr = subtotal[u] + up + total - sum[u];
  ans = max(ans, curr);

  for(int &v : edge[u])
  {
    if(v != prev)
      DFS2(v, u, curr - subtotal[v] - sum[v]);
  }
}

int main()
{
  cin.tie(NULL);
  cout.tie(NULL);

  int n;
  cin >> n;

  for(int i = 1; i <= n; i++)
  {
    cin >> a[i];
    total += (long long)a[i];
  }

  for(int i = 1; i < n; i++)
  {
    int u, v;
    cin >> u >> v;
    edge[u].push_back(v);
    edge[v].push_back(u);
  }

  DFS(1, 0);
  DFS2(1, 0, (long long)0);

  cout << ans << "\n";
  return 0;
}
