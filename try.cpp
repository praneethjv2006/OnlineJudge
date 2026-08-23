#include <bits/stdc++.h>
using namespace std;

int main(){
    int t;
    cin>>t;
    while(t--){
        int n, q;
        cin>>n>>q;
        string s;
        cin>>s;

        vector<int>pref(n, 0);
        for(int i=1; i<n; i++){
            pref[i] = pref[i-1];
            if(s[i]==s[i-1]) pref[i]++;
        }

        while(q--){
            int l, r, k;
            cin>>l>>r>>k;
            l--;
            r--;
            int bad = pref[r]-pref[l];
            int need = (bad+1)/2;
            if(need<=k) cout<<"YES\n";
            else cout<<"NO\n";
        }
    }
    return 0;
}