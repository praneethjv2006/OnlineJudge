#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin>>t;
    while(t--){
        string a, b;
        cin>>a>>b;
        int n = a.size();
        int m = b.size();
        vector<int> preA(n+1, 0), preB(m+1, 0);
        for(int i = 1; i<=n; i++) preA[i] = (preA[i-1]+(a[i-1] -'0'))%10;
        for(int i = 1; i<=m; i++) preB[i] = (preB[i-1]+(b[i-1] -'0'))%10;

        //dp[i][j] = maximum equal string length with first i of a and first j of b
        vector<vector<int>> dp(n+1, vector<int>(m+1, -1));
        dp[0][0] = 0;
        vector<vector<int>> bestCol(10, vector<int>(m+1, -1));

        for(int j = 0; j <= m; j++) {
            int diff = (preA[0] - preB[j] + 10) % 10;
            bestCol[diff][j] = dp[0][j];
        }

        for (int i = 1; i <= n; i++) {

            // bestRow[diff]
            // best answer till previous column
            vector<int> bestRow(10, -1);

            // Initially consider column 0
            for (int d = 0; d < 10; d++)
                bestRow[d] = bestCol[d][0];

            for (int j = 1; j <= m; j++) {

                int diff = (preA[i] - preB[j] + 10) % 10;

                // Can we create one more equal digit?
                if (bestRow[diff] != -1)
                    dp[i][j] = bestRow[diff] + 1;

                // Update bestRow using current column
                for (int d = 0; d < 10; d++)
                    bestRow[d] = max(bestRow[d], bestCol[d][j]);
            }

            // Store current row into bestCol
            for (int j = 0; j <= m; j++) {

                if (dp[i][j] == -1)
                    continue;

                int diff = (preA[i] - preB[j] + 10) % 10;

                bestCol[diff][j] = max(bestCol[diff][j], dp[i][j]);
            }
        }

        cout << dp[n][m] << '\n';
    }

    return 0;
}