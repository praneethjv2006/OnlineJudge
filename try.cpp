#include <bits/stdc++.h>
using namespace std;
#define ll long long

int main(){
    int t;
    cin>>t;
    while(t--){
        int n;
        cin>>n;
        multiset<ll>mp;
        for(int i=0;i<n;i++){
            ll x;
            cin>>x;
            mp.insert(x);
        }

        vector<ll> ans;
        ll sum = 0;
        bool ok = true;
        for(int i=0;i<n;i++){
            auto it = mp.lower_bound(1-sum);
            if(it == mp.end()){
                ok = false;
                break;
            }
            ll x = *it;
            mp.erase(it);
            sum += x;
            ans.push_back(sum);
        }

        if(!ok){
            cout<<-1<<endl;
            continue;
        }
        for(int i=0;i<n;i++){
            cout<<ans[i]<<" ";
        }
        cout<<endl;
    }
    return 0;
}