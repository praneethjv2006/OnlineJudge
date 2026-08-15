/*
Problem:
A doctor starts from Division 1 of a laboratory. The laboratory is represented as a directed graph, where 
each edge has a probability indicating the chance that the doctor moves to the next division.

The doctor stays exactly 10 minutes in every division before moving to the next division. 
The travel time between divisions is ignored.

Given a time T (always a multiple of 10), determine which division the doctor is most likely to be in at that 
time and print its probability.

Special Rule:
If the doctor reaches a division that has no outgoing edges, he stays there for 10 minutes and then 
leaves the laboratory. He does not move anywhere else after that.

Input:
The first line contains an integer T — number of test cases.
For each test case:
The first line contains three integers:
N — number of divisions.
E — number of directed edges.
Time — time (in minutes) after which the doctor's location must be determined.
The next E lines each contain:
u v p
u = starting division.
v = destination division.
p = probability of moving from u to v.

The doctor always starts from Division 1 with probability 1.0.

Output:
For each test case, print:
division probability
where:
division is the division having the highest probability at the given time.
probability is the probability of the doctor being in that division.
Constraints
1 ≤ T ≤ 20
1 ≤ N ≤ 100
0 ≤ E ≤ N²
Time is a multiple of 10
0 ≤ probability ≤ 1
The sum of outgoing probabilities from a node may be equal to 1.
Example:
Input
1
6 10 10
1 2 0.3
1 3 0.7
3 3 0.2
3 4 0.8
2 4 1.0
4 5 0.9
4 4 0.1
5 6 1.0
6 3 0.5
6 6 0.5
Output
3 0.700000
*/


#include <bits/stdc++.h>
using namespace std;

void dfs(int node, int timeLeft, double probability, vector<vector<double>> &graph, vector<double> &answer, int n){
    // Required time reached
    if (timeLeft == 0) {
        answer[node] += probability;
        return;
    }

    bool hasEdge = false;
    for (int next = 1; next <= n; next++) {
        if (graph[node][next] > 0) {
            hasEdge = true;
            dfs(next, timeLeft - 10, probability * graph[node][next], graph, answer, n);
        }
    }
    // No outgoing edge
    if (!hasEdge) {answer[node] += probability;}
}

int main() {
    int tc;
    cin >> tc;
    while (tc--) {
        int n, edges, time;
        cin >> n >> edges >> time;
        vector<vector<double>> graph(n + 1, vector<double>(n + 1, 0));
        for (int i = 0; i < edges; i++) {
            int u, v;
            double p;
            cin >> u >> v >> p;
            graph[u][v] = p;
        }

        vector<double> answer(n + 1, 0);
        dfs(1, time, 1.0, graph, answer, n);
        int bestDivision = 1;
        double bestProbability = 0;

        for (int i = 1; i <= n; i++) {
            if (answer[i] > bestProbability) {
                bestProbability = answer[i];
                bestDivision = i;
            }
        }

        cout << bestDivision << " ";
        cout << fixed << setprecision(6)<< bestProbability << "\n";
    }

    return 0;
}