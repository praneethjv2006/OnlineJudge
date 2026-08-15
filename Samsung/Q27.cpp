/*
Problem: A spaceship starts at the bottom-center of a board having 5 columns.
The board has N rows and each cell contains:
0 → Empty
1 → Coin
2 → Enemy

Initially the spaceship is below the last row in the middle column (column 2, 0-based indexing).
At every step:

The spaceship may move:
Left diagonal
Straight up
Right diagonal
Then the grid moves down by one row (equivalently, the spaceship moves one row upward).

If the spaceship reaches

a coin → collect it.
an enemy → game ends immediately.

The spaceship has one bomb that can be used at most once.

When used, all enemies in the nearest 5 rows above the spaceship become empty (0).

Find the maximum number of coins that can be collected.

Input
First line contains T
For each test case:
Integer N
N rows of 5 integers (0, 1, 2)
Output

For each test case print

#case_number maximum_coins
Constraints
1 ≤ N ≤ 15
Grid width is always 5
Easy Idea

At every row we have only 3 possible moves:

left
straight
right

Also,

bomb not used
bomb already used

So simply try every possibility using DFS / Backtracking.

Whenever

coin → add 1
enemy
if bomb available → use bomb
otherwise stop.

Keep the maximum coins collected.
*/

#include<bits/stdc++.h>
using namespace std;

void recover(vector<vector<int>>&space, vector<pair<int,int>>&changed, int row){
    for(auto &p: changed){
        space[p.first][p.second] = 2;
    }
}

void dfs(vector<vector<int>>&space, int row,int col,int coins,bool bombUsed,int&ans){
    if(col>=5 || col<0) return;
    if(row==space.size()){
        ans = max(ans, coins);
        return;
    }
    if(space[row][col]==2) return;
    int add= (space[row][col]==1);
    //continue without using bomb
    dfs(space, row+1, col, coins+add, bombUsed, ans);
    dfs(space, row+1, col-1, coins+add, bombUsed, ans);
    dfs(space, row+1, col+1, coins+add, bombUsed, ans);
    //use bobs here
    if(!bombUsed){
        vector<pair<int,int>> changed;
        for(int i = row;i<min(row+5, (int)space.size()); i++){
            for(int j = 0; j< 5; j++){
                if(i<space.size() && space[i][j]==2){
                    changed.push_back({i,j});
                    space[i][j] = 0;
                }
            } 
        }
        dfs(space, row+1, col, coins+add, true, ans);
        dfs(space, row+1, col-1, coins+add, true, ans);
        dfs(space, row+1, col+1, coins+add, true, ans);
        recover(space, changed, row);
    }

}

int main(){
    int n;
    cin>>n;
    vector<vector<int>> space(n, vector<int>(5));
    for(int i = 0; i<n; i++){
        for(int j = 0; j<5; j++){
            cin>>space[i][j];
        }
    }
    int ans= -1e9;
    dfs(space, 0, 2, 0, false, ans);
    cout<<ans<<'\n';
    return 0;
}