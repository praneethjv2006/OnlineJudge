/*
Problem: A necklace contains 2 × N beads arranged in a line.
Each bead is either:
'R' → Red 'B' → Blue
There is a fixed knot between the N-th and (N+1)-th bead.
No bead can cross the knot.
You may remove beads only from the left end or only from the right end.

Your task is to remove the minimum number of beads so that the remaining necklace has equal numbers of Red
 and Blue beads.

Input:
First line contains T — number of test cases.
For each test case:
An integer N.
A string S of length 2 × N consisting only of 'R' and 'B'.

Output:
For each test case print
#case_number minimum_beads_removed
Constraints
1 ≤ N ≤ 100000
Length of string = 2 × N
Example
Input
3
2
RRRR
3
RRBRBR
3
RBBBBB
Output
#1 4
#2 2
#3 6
*/
#include<bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin>>n;
    string s;
    cin>>s;
    unordered_map<char,int> mp;
    int cur =0;
    mp[0] = -1;
    int ans = 0;
    for(int i = 0;i<2*n;i++){
        if(s[i] == 'B')cur++;
        else if(s[i] == 'R')cur--;
        if(mp.find(cur)!=mp.end() && mp[cur]<n && i>=n){
            ans = max(ans, i-mp[cur]);
        }
        else{
            mp[cur] = i;
        }
    }
    cout<<2*n-ans<<endl;
    return 0;
}