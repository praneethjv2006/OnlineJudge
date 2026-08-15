#include<bits/stdc++.h>
using namespace std;
int dist(pair<int,int> a, pair<int,int> b){
    int dx = a.first - b.first;
    int dy = a.second - b.second;
    return dx*dx + dy*dy;
}

int cross(pair<int,int> a, pair<int,int> b, pair<int,int> c){
    return (b.first - a.first) * (c.second - a.second) - (b.second - a.second) * (c.first - a.first);
}

bool cmp(pair<int,int> a, pair<int,int> b){
    if(a.first != b.first) return a.first < b.first;
    return a.second < b.second;
}

int main(){
    int n;
    cin>>n;
    vector<pair<int,int>> points(n);
    for(int i = 0; i < n; i++){
        cin>>points[i].first>>points[i].second;
    }
    sort(points.begin(), points.end(), cmp);
    points.erase(unique(points.begin(), points.end()), points.end());
    n = points.size();
    if(n < 3){
        cout << -1;
        return 0;
    }
    int start = 0;
    vector<int> hull;
    int cur = start;
    do{
        hull.push_back(cur);
        int next = (cur + 1) % n;
        for(int i =0 ;i<n; i++){
            if(cross(points[cur], points[i], points[next])>0){
                next = i;
            }
            else if(cross(points[cur], points[i], points[next])==0){
                if(dist(points[cur], points[i]) > dist(points[cur], points[next])){
                    next = i;
                }
            }
        }
        cur = next;
    }while(cur != start);

    for(int x: hull){
        cout<<points[x].first<<" "<<points[x].second<<"\n";
    }
    cout<<endl;

    return 0;
}
