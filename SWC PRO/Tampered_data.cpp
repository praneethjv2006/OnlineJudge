/*
Given two array: One array contains original data and another array contains tampered data.
The tampered data has error of an significant factor 'e'.

So, if you add 'e' or subtract 'e' with the original data, the number should be present in the original data array.
If this is true for all the original data elements, return 0, Else return -1.
*/

#include<iostream>
using namespace std;

int solve(vector<int> &A, unordered_map<int, int> &B, int e)
{
  for(int &n : A)
  {
    if(B[n - e] > 0) B[n - e]--;
    else if(B[n + e] > 0) B[n + e]--;
    else return false;
  }
  return true;
}

int main()
{
  cin.tie(NULL);
  cout.tie(NULL);

  int n, e;
  cin >> n >> e;
  vector<int> A(n);
  unordered_map<int, int> B;

  for(int i = 0; i < n; i++)
    cin >> A[i];

  for(int i = 0; i < n; i++)
  {
    int val;
    cin >> val;
    B[val]++;
  }

  bool ans = solve(A, B, e);

  if(ans) cout << 0 << " ";
  else cout << -1 << " ";

  return 0;
}
