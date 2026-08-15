/*
Problem: You are given an N × N maze.

Each cell contains one of the following values:
0 → Empty path   1 → Wall (cannot pass)   2 → Jewel

The entrance is the top-left cell (0,0) and the exit is the bottom-right cell (N-1,N-1).
You must travel from the entrance to the exit while collecting the maximum possible number of jewels.

Rules:
You may move up, down, left, or right.
You cannot move through walls (1).
You cannot visit the same cell more than once.
If multiple paths collect the same maximum number of jewels, any one of them may be printed.

Your task is to:
Find the maximum number of jewels that can be collected.
Print one path achieving this maximum by marking every cell on the path with 3.
Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains an integer N.
The next N lines contain N integers representing the maze.

Output
For each test case:
Print the maze after replacing every cell on the chosen path with 3.
On the next line print the maximum number of jewels collected.
Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ 10
Example
Input
1
4
0 2 1 0
0 0 2 0
1 0 0 2
0 0 0 0
Output
3 3 1 0
0 3 3 0
1 0 3 3
0 0 0 3

3

(Any optimal path is accepted.)
*/

#include <bits/stdc++.h>
using namespace std;

int n;
int bestJewels;
int dx[] = {-1, 1, 0, 0};
int dy[] = {0, 0, -1, 1};
vector<vector<int>> maze;
vector<vector<int>> visited;
vector<vector<int>> bestPath;
#include<bits/stdc++.h>
using namespace std;

void dfs(vector<vector<int>>&grid, vector<vector<bool>>&pathvis,pair<int,int> cur, pair<int,int> dest,int &ans,int cur_coins){
    if(cur == dest){
        ans = max(ans,cur_coins);
        return;
    }
    int n = grid.size();
    int m = grid[0].size();
    vector<int> di= {-1,1,0,0};
    vector<int> dj= {0,0,-1,1};
    pathvis[cur.first][cur.second] = true;
    for(int k=0;k<4;k++){
        int ni = cur.first + di[k];
        int nj = cur.second + dj[k];
        if(ni>=0 && ni<n && nj>=0 && nj<m && !pathvis[ni][nj] && grid[ni][nj]!=1){
            if(grid[ni][nj]==2) dfs(grid,pathvis,{ni,nj},dest,ans,cur_coins+1);
            else dfs(grid,pathvis,{ni,nj},dest,ans,cur_coins);
        }
    }

    pathvis[cur.first][cur.second] = false;
}

int main(){
    int n,m;
    cin>>n>>m;
    vector<vector<int>> grid(n,vector<int>(m));
    for(int i=0;i<n;i++){
        for(int j=0;j<m;j++){
            cin>>grid[i][j];
        }
    }
    vector<vector<bool>> pathvis(n, vector<bool>(m,false));
    int ans =0;
    dfs(grid,pathvis,{0,0}, {n-1,m-1},ans, 0);
    cout<<ans<<endl;
    return 0;
}