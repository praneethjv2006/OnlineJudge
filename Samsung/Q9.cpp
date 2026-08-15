/*
Problem:
There are N pots, each containing some water. For every pot, you are given its overflow number,
 which is the minimum number of stones required to make that pot overflow.

A crow wants to make exactly K pots overflow. However, the crow does not know which pot has which overflow number. 
It only knows the list of overflow numbers, so to guarantee that K pots overflow in the worst case, 
it must choose its strategy carefully.

Your task is to find the minimum number of stones the crow must throw to guarantee that at least K pots overflow.

Input:
The first line contains an integer N — the number of pots.
The second line contains N integers representing the overflow numbers of the pots.
The third line contains an integer K — the number of pots that must overflow.

Output:
Print a single integer representing the minimum number of stones required to guarantee that K pots overflow 
in the worst case.

Constraints
1 ≤ N ≤ 10^5
1 ≤ K ≤ N
1 ≤ overflow[i] ≤ 10^9
*/


#include <bits/stdc++.h>
using namespace std;

int main() {

    int n;
    cin >> n;
    vector<int> overflow(n);
    for (int i = 0; i < n; i++) cin >> overflow[i];
    int k;
    cin >> k;

    sort(overflow.begin(), overflow.end());
    long long stones = 0;
    int remainingPots = n;
    int previous = 0;

    for (int i = 0; i < k; i++) {
        stones += 1LL * (overflow[i] - previous) * remainingPots;
        previous = overflow[i];
        remainingPots--;
    }

    cout << stones;

    return 0;
}