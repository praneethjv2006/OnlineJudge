/*
Convex Hull of a Set of Points
Problem Statement: You are given N points on a 2D plane.
Your task is to find the Convex Hull of these points.
The convex hull is the smallest convex polygon that contains all the given points either inside it or on its boundary.
If it is not possible to form a convex polygon (i.e., fewer than 3 distinct boundary points exist), print -1.
Print all points on the convex hull in sorted order of (x, y).

Input Format
First line contains T — number of test cases.
For each test case:
Integer N
N lines follow, each containing two integers x y.

Output Format:
For each test case:

Print all convex hull points in sorted order.
If a convex hull cannot be formed, print -1.
Constraints
1 ≤ T ≤ 10
1 ≤ N ≤ 10^3
Coordinates are integers.
Example
Input
1
7
0 3
2 2
1 1
2 1
3 0
0 0
3 3
Output
0 0, 0 3, 3 0, 3 3
What is a Convex Hull?
Imagine hammering nails into a wooden board at the given points.
Now stretch a rubber band around all the nails.
When released, the rubber band forms the convex hull.
        ●
     ●     ●

  ●           ●

     ●     ●

The rubber band touches only the outermost points.

Approach (Jarvis March / Gift Wrapping)
Find the leftmost point.
Add it to the hull.
Find the most counter-clockwise point with respect to the current point.
Move to that point.
Repeat until reaching the starting point again.

Finally,

Remove duplicate points.
Sort the hull points.
Print them.
Orientation Function

For three points
P → Q → R

Compute
(q.y-p.y)*(r.x-q.x) -
(q.x-p.x)*(r.y-q.y)

Result:

0 → Collinear
1 → Clockwise
2 → Counter-clockwise

Whenever a more counter-clockwise point is found, update the next hull point.

Algorithm
Find the leftmost point.
Start wrapping around the points.
At every step:
Assume the next point.
Scan all points.
Replace it if a more counter-clockwise point exists.
Stop when back at the starting point.
Sort and remove duplicates.
Print the hull.
Complexity

Let N be the number of points.

Finding each hull point takes O(N).
Suppose there are H points on the hull.
Time
O(N × H)

Worst case:

O(N²)
Space
O(H)
*/

#include <bits/stdc++.h>
using namespace std;

struct Point {
    int x, y;
};

// Returns:
// 0 -> Collinear
// 1 -> Clockwise
// 2 -> Counter-clockwise
int orientation(Point p, Point q, Point r) {
    int val =
        (q.y - p.y) * (r.x - q.x) -
        (q.x - p.x) * (r.y - q.y);
    if (val == 0)
        return 0;

    return (val > 0) ? 1 : 2;
}

bool compare(Point a, Point b) {
    if (a.x != b.x)
        return a.x < b.x;
    return a.y < b.y;
}

bool samePoint(Point a, Point b) {
    return a.x == b.x && a.y == b.y;
}

void convexHull(vector<Point> &points) {
    int n = points.size();
    if (n < 3) {
        cout << -1 << "\n";
        return;
    }
    vector<Point> hull;
    // Leftmost point
    int left = 0;
    for (int i = 1; i < n; i++) {
        if (points[i].x < points[left].x)
            left = i;
    }

    int p = left;

    do {

        hull.push_back(points[p]);

        int q = (p + 1) % n;

        for (int i = 0; i < n; i++) {

            if (orientation(points[p],
                            points[i],
                            points[q]) == 2) {

                q = i;
            }
        }

        p = q;

    } while (p != left);

    sort(hull.begin(), hull.end(), compare);

    hull.erase(unique(hull.begin(),
                      hull.end(),
                      samePoint),
               hull.end());

    if (hull.size() < 3) {
        cout << -1 << "\n";
        return;
    }

    for (int i = 0; i < hull.size(); i++) {

        cout << hull[i].x << " "
             << hull[i].y;

        if (i + 1 != hull.size())
            cout << ", ";
    }

    cout << "\n";
}

int main() {

    int T;
    cin >> T;

    while (T--) {
        int N;
        cin >> N;
        vector<Point> points(N);
        for (int i = 0; i < N; i++)
            cin >> points[i].x >> points[i].y;
        convexHull(points);
    }
}