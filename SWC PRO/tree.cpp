/* given a graph each node has some value ,in one operation you can either decrease or increase the value,
if we do one operation on one node then each node of the subtree also gets the same operation applied.
we need to make whole graph value 0 , with minimum number of ops.*/
#include<bits/stdc++.h>
using namespace std;
int ans=0;
vector<int> vals;
void solve(int node_no,vector<vector<int>> &graph,int sum)
{
  vals[node_no]=vals[node_no]+sum;
  int ops=-vals[node_no];
  ans+=abs(ops);
  for(auto x:graph[node_no]){
    solve(x,graph,sum+ops);
  }
}
int main(){
  int nodes;
  cin>>nodes;
  vector<vector<int>> graph(nodes);
  vals.resize(nodes);
  int edges;
  cin>>edges;
  for(int i=0;i<nodes;i++){//for n nodes this will store the values
    int value;
    cin>>value;
    vals[i]=value;
  }
  for(int i=0;i<edges;i++){//this will store the edges if node 0 is parent of node 2 then 0->2 etc
    int a,b;
    cin>>a>>b;
    graph[a].push_back(b);
  }
  solve(0,graph,0);
  cout<<ans<<endl;
}
