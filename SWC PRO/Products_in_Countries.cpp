/*
You are given an array A containing the initial number of products in different countries.
Array B contains the no. of products imported into each country everyday.
On each day, you can export any no. of products from just one country.
Find the minimum no. of days for the sum of products across all countries
to be less than a given no. M.
*/

#include<iostream>
using namespace std;

vector<long long>& a, b;
long long dp[21][21][21];

long long solve(long long index, long long left, long long curr, long long days)
{
  if(index == a.size()) return 0;

  if(dp[index][left][curr] == -1)
  {
    long long ans = a[index] + (days * b[index]) + solve(index + 1, left, curr, days);
    if(left) ans = min(ans, curr * b[index] + solve(index + 1, left - 1, curr + 1, days));

    dp[index][left][curr] = ans;
  }
  return dp[index][left][curr];
}

int main()
{
  cin.tie(0);
  cout.tie(0);
  long long n, m;
  cin >> n >> m;
  vector<pair<long long, long long>> arr(n);
  a = vector<long long>(n);
  b = vector<long long>(n);

  for(long long i = 0; i < n; i++)
    cin >> arr[i].second;

  for(long long i = 0; i < n; i++)
    cin >> arr[i].first;

  sort(arr.begin(), arr.end(), greater<pair<long long>>());

  for(long long i = 0; i < n; i++)
  {
    a[i] = arr[i].second;
    b[i] = arr[i].first;
  }

  long long ans = INT_MAX;

  for(long long i = 0; i <= n; i++)
  {
    memset(dp, -1, sizeof(dp));
    if(solve(0, i, 0, i) <= k)
    {
      ans = i;
      break;
    }
  }

  if(ans == INT_MAX) cout << 1 ;
  else cout << ans << " ";
  return 0;
}
