/*
Sum of Nodes at a Given Level in a Binary Tree
Problem Statement: A binary tree is represented using the following parenthesized format:
(value(left_subtree)(right_subtree))

where:
value is an integer (can be negative).
An empty subtree is represented as ().

Given an integer L, find the sum of all node values present at level L.
The root is at level 0.

Input Format
First line contains an integer L.
Second line contains the binary tree in parenthesized form.
Output Format

Print a single integer representing the sum of all node values at level L.

Constraints
0 ≤ L ≤ 100
Number of nodes ≤ 100
Node values can be positive or negative.
Each node value fits in a 32-bit signed integer.
Example
Input
3
(0(5(6()())(-4()(9()())))(7(1()())(3()())))
Output
9
Explanation

Tree:

              0
           /     \
         5         7
       /   \     /   \
      6    -4   1     3
             \
              9

Levels:

Level 0 → 0
Level 1 → 5, 7
Level 2 → 6, -4, 1, 3
Level 3 → 9

Sum at level 3 = 9

Approach

We do not need to construct the tree.

While scanning the string:

'(' means we are going one level deeper.
')' means we are coming one level up.
Whenever we read a complete integer, we know its current level.
If its level matches the required level, add it to the answer.

Since the parser increases the level immediately after '(', the actual node level is currentLevel - 1.

Algorithm
Read the required level L.
Traverse the tree string.
Maintain the current depth.
Whenever a number is encountered:
Parse the complete integer (including negative values).
If its level is L, add it to the answer.
Print the answer.
*/
#include <bits/stdc++.h>
using namespace std;

int main() {

    int targetLevel;
    cin >> targetLevel;

    string tree;
    cin >> tree;
    int currentLevel = 0;
    int answer = 0;
    int i = 0;
    while (i < tree.size()) {
        if (tree[i] == '(') {
            currentLevel++;
            i++;
        }
        else if (tree[i] == ')') {
            currentLevel--;
            i++;
        }
        else {
            int sign = 1;
            if (tree[i] == '-') {
                sign = -1;
                i++;
            }
            int value = 0;
            while (i < tree.size() && isdigit(tree[i])) {
                value = value * 10 + (tree[i] - '0');
                i++;
            }
            value *= sign;
            // Actual node level = currentLevel - 1
            if (currentLevel - 1 == targetLevel)
                answer += value;
        }
    }

    cout << answer << "\n";

    return 0;
}