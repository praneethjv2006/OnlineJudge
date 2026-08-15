#include<iostream>
#include<bits/stdc++.h>
#define MAXN (1000 * 100);
using namespace std;

int solve(vector<pair<int, int>>& tiles, int mid, int k)
{
  int j = 0;
  set<int> s;
  map<int, int> mp;

  for(int i = 0; i < tiles.size(); i++)
  {
    while(j < tiles.size() && tiles[j].first - tiles[i].first <= mid)
    {
      s.insert(tiles[i].second);
      mp[tiles[i].second]++;
      j++;
    }

    int sum = 0, left = 0;
    vector<int> possible_y_values;

    if(i == 0 || tiles[i].first != tiles[i - 1].first)
    {
      for(auto &m : s)
      {
        if(possible_y_values.size() > 0)
        {
          while(left < possible_y_values.size() && m - possible_y_values[left] >= mid)
          {
            sum -= mp[possible_y_values[left]];
            left++;
          }
        }

        sum += mp[m];
        possible_y_values.push_back(m);
        if(sum >= k) return 1;
      }
      mp[tiles[i].second]--;
      if(mp[tiles[i].second] == 0) s.erase(tiles[i].second);
    }
  }
  return 0;
}

int main()
{
  int n, k;
  cin >> n >> k;
  vector<pair<int, int>> tiles(MAXN);

  for(int i = 0; i < n; i++)
  {
    cin >> tiles[i].first >> tiles[i].second;
  }

  sort(tiles.begin(), tiles.end());

  int low = 0, high = 400, ans = -1;
  while(low <= high)
  {
    int mid = low + (high - low)/2;
    if(solve(tiles, mid, k) >= m)
    {
      ans = mid;
      right = mid - 1;
    }
    else low = mid + 1;
  }
  cout << ans << " ";
  return 0;
}
