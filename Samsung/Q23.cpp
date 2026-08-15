/*
Minimum Touches to Type a Number (Samsung)
Problem Statement: 
You are given an old smartphone with: A Dial Pad containing digits 0 to 9.
A Calculator containing: Digits 0 to 9 Operators +, -, *, / = button.           

Unfortunately, some digit keys and some operators are broken.                    
Your goal is to obtain a given target number using the minimum number of touches.

You can obtain the target in two ways:                                 
Directly type the number using the working digit keys.                 
Create the number using the calculator, then press = to get the result.

Each button press counts as one touch.                                                  
If it is impossible to obtain the target within the allowed number of touches, print -1.

Input Format:
The first line contains an integer T — number of test cases.

For each test case:
First line contains three integers:
N M O
N = number of working digit keys
M = number of working operators
O = maximum touches allowed

Second line contains N working digits.
Third line contains M working operators encoded as:
Value	Operator
1	    +
2	    -
3	    *
4	    /

Fourth line contains the target number.

Output Format:
For every test case print the minimum touches required.
If it cannot be formed within O touches, print -1.

Sample Input:
5
5 3 5
1 2 4 6 0
1 2 3
5

6 4 5
1 2 4 6 9 8
1 2 3 4
91

6 2 4
0 1 3 5 7 9
1 2
28

5 2 10
1 2 6 7 8
2 3
981

6 3 5
1 4 6 7 8 9
1 2 3
18

Sample Output:
4
2
5
9
2

Explanation
Test Case 1

Target = 5

Digit 5 is broken.

One possible way:

1 + 4 =

Touches:

1
+
4
=

Total = 4
*/


#include <bits/stdc++.h>
using namespace std;

const int INF = 1e9;
const int EMPTY = -10000000;

int n, m, maxTouch;
int target;

vector<int> digits;
vector<int> ops;

int answer;

int evaluate(int previous, int current, int operation){
    if (previous == EMPTY) return current;
    if (operation == 1) return previous + current;
    if (operation == 2) return previous - current;
    if (operation == 3) return previous * current;
    if (operation == 4){
        if (current == 0)return INF;
        return previous / current;
    }
    return current;
}

void dfs(int previous, int current, int operation, int touches){
    if (touches > maxTouch) return;
    //Direct typing
    if (operation == -1 && current == target) answer = min(answer, touches);
    //Expression completed by pressing '='
    if (operation != -1 && current != EMPTY){
        int value = evaluate(previous, current, operation);
        if (value != INF && value == target) answer = min(answer, touches + 1);
    }
    //Current expression already finished
    if (operation != -1 && current == EMPTY && previous == target) {
        answer = min(answer, touches);
    }
    //Try pressing an operator
    if (current != EMPTY){
        int value = evaluate(previous, current, operation);
        if (value != INF){
            for (int op : ops){
                dfs(value, EMPTY, op, touches + 1);
            }
        }
    }
    //Try pressing another digit
    for (int d : digits){
        if (current == EMPTY){
            dfs(previous, d, operation, touches + 1);
        }
        else{
            int nextNumber;
            if (current >= 0) nextNumber = current * 10 + d;
            else nextNumber = current * 10 - d;
            dfs(previous, nextNumber, operation, touches + 1);
        }
    }
}

int main(){
    int T;
    cin >> T;
    while(T--){
        cin >> n >> m >> maxTouch;
        digits.clear();
        ops.clear();
        for (int i = 0; i < n; i++) {
            int x;
            cin >> x;
            digits.push_back(x);
        }
        for (int i = 0; i < m; i++){
            int x;
            cin >> x;
            ops.push_back(x);
        }
        cin >> target;

        answer = INF;
        dfs(EMPTY, EMPTY, -1, 0);
        if (answer > maxTouch) cout << -1 << "\n";
        else cout << answer << "\n";
    }

    return 0;
}