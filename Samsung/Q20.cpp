/*
Problem: Mr. Kim starts from his office, must visit every customer exactly once, and finally reach his home.
Each location is represented by coordinates (x, y).
The distance between two locations is the Manhattan distance:
|x1 - x2| + |y1 - y2|
Find the minimum total distance required.

Input:
First line contains T — number of test cases.
For each test case:
First line contains N — number of customers.
Second line contains:
Office coordinates (x, y)
Home coordinates (x, y)
Coordinates of N customers.

Output:
For every test case print
#caseNumber minimumDistance
Constraints
5 ≤ N ≤ 10
0 ≤ x,y ≤ 100
Example
Input
1
2
0 0 100 100 70 40 30 10
Output
#1 200
*/

#include <bits/stdc++.h>
using namespace std;
struct Point {int x, y;};

int n;
Point office, home;
Point customer[10];
int answer;

int distance(Point a, Point b) {
    return abs(a.x - b.x) + abs(a.y - b.y);
}

void dfs(Point current, bool visited[], int count, int cost) {
    // Pruning
    if (cost >= answer) return;
    // All customers visited
    if (count == n) {
        answer = min(answer, cost + distance(current, home));
        return;
    }
    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            visited[i] = true;
            dfs(customer[i], visited, count + 1, cost + distance(current, customer[i]));
            visited[i] = false;
        }
    }
}

int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; tc++) {
        cin >> n;
        cin >> office.x >> office.y;
        cin >> home.x >> home.y;
        for (int i = 0; i < n; i++)  cin >> customer[i].x >> customer[i].y;
        answer = INT_MAX;
        bool visited[10] = {false};
        dfs(office, visited, 0, 0);
        cout << "#" << tc << " " << answer << "\n";
    }
    return 0;
}