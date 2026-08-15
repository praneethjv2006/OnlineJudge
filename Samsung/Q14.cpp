/*
Problem: There are N fishing spots arranged in a straight line and numbered from 1 to N.
There are exactly 3 gates. Each gate is located at a fixed fishing spot and has a certain number of fishermen waiting.
The fishermen from a gate enter one by one. Each fisherman must occupy one unique empty fishing spot.

Distance: If a fisherman enters from gate G and sits at spot P, the walking distance is |G - P| + 1
The +1 counts the gate itself.

Example:
Gate = 5
Spot 5 → Distance = 1
Spot 4 → Distance = 2
Spot 7 → Distance = 3

Rules
Every fishing spot can be occupied by only one fisherman.
Fishermen from the same gate should always take the nearest available spot.
If both left and right spots are at the same minimum distance, either choice is allowed, and both possibilities must be considered.
The order in which the three gates are processed is not fixed. Any gate can be processed first.

Your task is to find the minimum possible total walking distance of all fishermen.

Input:
First line: N — number of fishing spots.
Next 3 lines:
gatePosition
numberOfFishermen

Output:
Print a single integer representing the minimum total walking distance.

Constraints
1 ≤ N ≤ 100
Exactly 3 gates
Total fishermen ≤ N

Example
Input
10
4 5
6 2
10 2
Output
16
*/
#include <bits/stdc++.h>
using namespace std;

void assign(vector<int> &gate, vector<int>&people, vector<int> &order, int gate_idx, int left,int cur_cost, int &ans, vector<bool> &used){
    if(gate_idx>=3 ){
        ans = min(ans, cur_cost);
        return;
    }
    if(left == 0 ){
        if(gate_idx == 2){
            ans = min(ans, cur_cost);
            return;
        }
        assign(gate, people, order, gate_idx+1, people[order[gate_idx+1]], cur_cost, ans, used);
        return;
    }
    int n = used.size()-1;
    //peopleleft > 0
    int g = order[gate_idx];
    int left_dist = -1;
    int i = gate[g];
    while(i>=1){
        if(!used[i]){
            left_dist = gate[g] - i;
            break;
        }
        i--;
    }
    int right_dist = -1;
    i = gate[g];
    while(i<=n){
        if(!used[i]){
            right_dist = i - gate[g];
            break;
        }
        i++;
    }
    if(left_dist == -1 && right_dist == -1) return;
    if(left_dist != -1 && (right_dist == -1 || left_dist < right_dist)){
        used[gate[g]-left_dist] = true;
        assign(gate, people, order, gate_idx, left-1, cur_cost + left_dist + 1, ans, used);
        used[gate[g]-left_dist] = false;
    }
    if(right_dist != -1 && (left_dist == -1 || right_dist < left_dist)){
        used[gate[g]+right_dist] = true;
        assign(gate, people, order, gate_idx, left-1, cur_cost + right_dist + 1, ans, used);
        used[gate[g]+right_dist] = false;
    }
    if(left_dist != -1 && right_dist != -1 && left_dist == right_dist){
        used[gate[g]-left_dist] = true;
        assign(gate, people, order, gate_idx, left-1, cur_cost + left_dist + 1, ans, used);
        used[gate[g]-left_dist] = false;

        used[gate[g]+right_dist] = true;
        assign(gate, people, order, gate_idx, left-1, cur_cost + right_dist + 1, ans, used);
        used[gate[g]+right_dist] = false;
    }

}

int main() {
    int n;
    cin >> n;
    vector<int> gate(3), people(3);
    for (int i = 0; i < 3; i++) cin >> gate[i] >> people[i];
    vector<int> order = {0,1,2};
    int answer = 1e9;
    do {
        vector<bool> used(n+1,false);
        int cur = 1e9;
        assign(gate, people, order, 0, people[order[0]], 0, cur, used);

        cout << order[0] << " "
            << order[1] << " "
            << order[2] << " -> "
            << cur << endl;

        answer = min(answer, cur);
    }
    while(next_permutation(order.begin(), order.end()));
  //  cout << answer << endl;

    return 0;
}