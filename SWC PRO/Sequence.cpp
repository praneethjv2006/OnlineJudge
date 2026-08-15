/*
You want to create a sequence {a0, a1, ...., an-1} whose length is N. The sequence should meet the following conditions:

(i) a0 should always be 0
(ii) ai, the ith number should always be an integer that is equal to or larger than 0
(iii) The absolute value of the difference between the ith number and the (i+1)th number should be equal to or smaller than 1.
In other words every i satisfies the condition of [ai - ai+1] <= 1

There can be a limited value in the sequence.
A limited value is given as (x, y). x means the place of a number and y means the maximm possible value of a number.

Find the way that maximizes the largest value when creating the sequence satisfying the aforementioned conditions.
Then, find the maximum value.

Example:
N = 10, M = 2
limited values = {{2,1}, {7,1}}
*/

#include<iostream>
#include<bits/stdc++.h>
using namespace std;
#define MAXN 10000

int seq[MAXN];

int solve(int n, int m)
{
  seq[0] = 0;

  for(int i = 1; i < n; i++)
  {
    if(seq[i] != -1) seq[i] = min(seq[i], seq[i - 1] + 1);
    else seq[i] = seq[i - 1] + 1;
  }

  int ans = 0;

  for(int i = n - 2; i >= 0 ; i--)
  {
    if(abs(seq[i] - seq[i + 1]) > 1)
      seq[i] = seq[i + 1] + 1;
  }

  for(int i = 0; i < n; i++)
  {
    cout << seq[i] << " ";
    ans = max(ans, seq[i]);
  }

  return ans;
}

int main()
{
  cin.tie(NULL);
  cout.tie(NULL);
  int n, m;
  cin >> n >> m;

  memset(seq, -1, sizeof(seq));
  for(int i = 0; i < m; i++)
  {
    int x, y;
    cin >> x >> y;
    seq[x] = y;
  }

  int ans = solve(n, m);
  cout << "\n" << ans << " ";
  return 0;
}
