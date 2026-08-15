/*
Given a set of integers, the task is to divide it into two sets S1 and S2 such that the
absolute difference between their sums is minimum.
If there is a set S with n elements, then if we assume Subset1 has m elements,
 Subset2 must have n-m elements and the value of abs(sum(Subset1) – sum(Subset2)) should be minimum.

Example:

Input: arr[] = {1, 6, 11, 5}
Output: 1

Explanation: Subset1 = {1, 5, 6}
             Subset2 = {11}
*/
#include<iostream>
#include<bits/stdc++.h>
#define SIZE (100 * 1000)
using namespace std;

int arr[SIZE];
long long total = (long long)0;

int solve(vector<vector<int>> &memo, int index, int sum)
{
    if(index < 0) return abs(total - sum - sum);

    if(memo[index][sum] == -1)
    {
        int a = solve(memo, index - 1, sum + arr[index]);
        int b = solve(memo, index - 1, sum);

        memo[index][sum] = min(a, b);
    }

    return memo[index][sum];
}

int main()
{
  int n;
  cin >> n;

  for(int i = 0; i < n; i++)
  {
    cin >> arr[i];
    total += arr[i];
  }

  vector<vector<int>> memo(n + 1, vector<int>(total + 1, -1));
  int ans = solve(memo, n - 1, 0);
  cout << ans;
  return 0;
}
