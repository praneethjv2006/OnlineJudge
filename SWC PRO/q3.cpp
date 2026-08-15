/*
Problem Statement (Simple)

You are given:

N points on a 2D plane.
M points that form a continuous path.
Every consecutive pair of path points is connected by either a horizontal or a vertical line segment.

Find how many of the N points lie on the path.

A point should be counted only once, even if it lies at the intersection of two segments.



 N < 10^6, M < 10^5 and 0 <= Axi,Ayi,Bxi,Byi <=10^9.

 Testcase 1:

 Input:

5 6
5 7 9 1 3
3 1 5 5 6
1 1 7 7 5 5
7 1 1 7 7 3

Output: 3

Testcase 2:

Input:

7 4
2 5 5 7 1 2 3
8 6 3 9 1 1 1
1 5 5 1
5 5 1 1

Output: 4
*/

#include <bits/stdc++.h>
using namespace std;

int main(){
    int n, m;
    cin >> n >> m;
    vector<int> ax(n), ay(n);
    vector<int> bx(m), by(m);
    for(int i = 0; i < n; i++)cin >> ax[i];
    for(int i = 0; i < n; i++)cin >> ay[i];
    for(int i = 0; i < m; i++)cin >> bx[i];
    for(int i = 0; i < m; i++) cin >> by[i];
    set<pair<int,int>> xToY;
    set<pair<int,int>> yToX;
    for(int i = 0; i < n; i++){
        xToY.insert({ax[i], ay[i]});
        yToX.insert({ay[i], ax[i]});
    }
    int ans = 0;
    for(int i = 1; i < m; i++){
        // Vertical segment
        if(bx[i] == bx[i-1]){
            int x = bx[i];
            int lowY = min(by[i], by[i-1]);
            int highY = max(by[i], by[i-1]);
            auto start = xToY.lower_bound({x, lowY});
            auto end = xToY.upper_bound({x, highY});
            vector<pair<int,int>> removePoints;
            for(auto it = start; it != end; it++){
                ans++;
                removePoints.push_back(*it);
            }
            for(auto p : removePoints) {
                xToY.erase(p);
                yToX.erase({p.second, p.first});
            }
        }
        // Horizontal segment
        else{
            int y = by[i];
            int lowX = min(bx[i], bx[i-1]);
            int highX = max(bx[i], bx[i-1]);
            auto start = yToX.lower_bound({y, lowX});
            auto end = yToX.upper_bound({y, highX});
            vector<pair<int,int>> removePoints;
            for(auto it = start; it != end; it++){
                ans++;
                removePoints.push_back(*it);
            }
            for(auto p : removePoints) {
                yToX.erase(p);
                xToY.erase({p.second, p.first});
            }
        }
    }
    cout << ans << endl;
    return 0;
}