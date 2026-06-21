#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int t;
    cin>>t;

    while(t--){
        int n, k;
        cin>>n>>k;

        vector<int> a(n);

        for(int i = 0; i<n; i++){
            cin>>a[i];
        }

        sort(a.begin(), a.end());

        vector<pair<int,int>> v;

        for(int i = 0; i<n; i++){

            int j = i;

            while(j<n && a[j] == a[i]) j++;

            v.push_back({a[i], j-i});

            i = j-1;
        }

        bool win = false;

        for(int i = (int)v.size()-1; i>=0; i--){

            if(i+1 < (int)v.size() &&
               v[i+1].first - v[i].first > k){

                win = false;
            }

            if(v[i].second & 1){
                win = !win;
            }
        }

        cout<<(win ? "YES" : "NO")<<'\n';
    }

    return 0;
}