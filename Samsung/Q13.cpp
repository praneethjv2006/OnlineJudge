/*
Problem

You are given an N × M underground map consisting of different types of pipes.

Each pipe allows movement only in certain directions (up, down, left, right).

A person starts from the cell (R, C) and can move through connected pipes.

The person can travel for at most L time units. Moving from one cell to an adjacent connected cell takes 1 unit of time.

Your task is to determine how many cells can be visited (including the starting cell) within the given time.

A move from one cell to another is possible only if:
The current pipe has an opening in that direction.
The adjacent pipe has an opening in the opposite direction.

Pipe Types
Pipe	Allowed Directions
0	No pipe
1	Up, Down, Left, Right
2	Up, Down
3	Left, Right
4	Up, Right
5	Down, Right
6	Down, Left
7	Up, Left
Input
The first line contains an integer T — number of test cases.
For each test case:
One line contains:
N M R C L
N = rows
M = columns
R C = starting position
L = maximum time
Next N lines contain M integers describing the pipe type in each cell.
Output

For each test case, print a single integer representing the number of cells that can be reached within time L.

Constraints
1 ≤ T ≤ 20
1 ≤ N, M ≤ 1000
1 ≤ L ≤ 1000
0 ≤ pipe ≤ 7
Example
Input
1
5 6 2 1 3
0 0 5 3 6 0
0 0 2 0 2 0
3 3 1 3 7 0
0 0 2 0 0 0
0 0 4 5 1 0
Output
6
*/

#include <bits/stdc++.h>
using namespace std;

struct Node { bool up, down, left, right;};
struct State { int row, col, time; };
bool valid(int x, int y, int n, int m) { return x >= 0 && x < n && y >= 0 && y < m; }

int main() {
    int T;
    cin >> T;
    while (T--) {
        int n, m, startRow, startCol, limit;
        cin >> n >> m >> startRow >> startCol >> limit;
        vector<vector<Node>> pipe(n, vector<Node>(m));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                int type;
                cin >> type;
                pipe[i][j] = {0,0,0,0};
                if(type==1) pipe[i][j]={1,1,1,1};
                if(type==2) pipe[i][j]={1,1,0,0};
                if(type==3) pipe[i][j]={0,0,1,1};
                if(type==4) pipe[i][j]={1,0,0,1};
                if(type==5) pipe[i][j]={0,1,0,1};
                if(type==6) pipe[i][j]={0,1,1,0};
                if(type==7) pipe[i][j]={1,0,1,0};
            }
        }
        if (!(pipe[startRow][startCol].up ||
              pipe[startRow][startCol].down ||
              pipe[startRow][startCol].left ||
              pipe[startRow][startCol].right)) {
            cout << 0 << endl;
            continue;
        }
        vector<vector<int>> visited(n, vector<int>(m, 0));
        queue<State> q;
        q.push({startRow,startCol,1});
        visited[startRow][startCol]=1;
        int answer=1;

        while(!q.empty()){
            State cur=q.front();
            q.pop();
            if(cur.time==limit)
                continue;
            // Up
            if(valid(cur.row-1,cur.col,n,m) &&
               !visited[cur.row-1][cur.col] &&
               pipe[cur.row][cur.col].up &&
               pipe[cur.row-1][cur.col].down){

                visited[cur.row-1][cur.col]=1;
                answer++;
                q.push({cur.row-1,cur.col,cur.time+1});
            }

            // Down
            if(valid(cur.row+1,cur.col,n,m) &&
               !visited[cur.row+1][cur.col] &&
               pipe[cur.row][cur.col].down &&
               pipe[cur.row+1][cur.col].up){

                visited[cur.row+1][cur.col]=1;
                answer++;
                q.push({cur.row+1,cur.col,cur.time+1});
            }

            // Left
            if(valid(cur.row,cur.col-1,n,m) &&
               !visited[cur.row][cur.col-1] &&
               pipe[cur.row][cur.col].left &&
               pipe[cur.row][cur.col-1].right){

                visited[cur.row][cur.col-1]=1;
                answer++;
                q.push({cur.row,cur.col-1,cur.time+1});
            }

            // Right
            if(valid(cur.row,cur.col+1,n,m) &&
               !visited[cur.row][cur.col+1] &&
               pipe[cur.row][cur.col].right &&
               pipe[cur.row][cur.col+1].left){

                visited[cur.row][cur.col+1]=1;
                answer++;
                q.push({cur.row,cur.col+1,cur.time+1});
            }
        }

        cout<<answer<<endl;
    }

    return 0;
}