/*
integer array given
Primary sum = sum of all elements till index i from 0
Secondary sum = i+1 to last elements ka sum
Find maximum primary sum - secondary sum
*/
#include<iostream>
#include<bits/stdc++.h>
#define MAXN 100
using namespace std;

int arr[MAXN], prefixSum[MAXN];

int solve(int n)
{
  int ans = 0;

  for(int i = 0; i < n; i++)
  {
    int primarySum = prefixSum[i];
    int secondarySum = prefixSum[n - 1] - prefixSum[i];

    ans = max(ans, primarySum - secondarySum);
  }
  return ans;
}

int main()
{
  int n;
  cin >> n;

  for(int i = 0; i < n; i++)
  {
    cin >> arr[i];
    if(i == 0) prefixSum[0] = arr[0];
    else prefixSum[i] = prefixSum[i - 1] + arr[i];
  }

  cout << solve(n) << " ";
  return 0;
}
