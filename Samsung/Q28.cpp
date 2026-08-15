/*
Merge Alphabet Frequencies
Problem Statement: You are given a compressed string consisting of lowercase English letters followed by positive integers.

Each letter is immediately followed by a number representing its frequency.
If the same letter appears multiple times in the string, its frequencies should be added together.
Print every character that appears along with its total frequency in alphabetical order.

Input Format
A single string S.
Output Format

For every character whose total frequency is greater than 0, print:
character frequency
in alphabetical order.

Constraints
1 ≤ |S| ≤ 1000
S contains only lowercase English letters and digits.
Every letter is followed by at least one digit.
Frequency can have multiple digits.
Example 1
Input
a12b5c3a8b7
Output
a 20
b 12
c 3
Explanation
a → 12 + 8 = 20
b → 5 + 7 = 12
c → 3
Example 2
Input
z10a5z20
Output
a 5
z 30
*/

#include <iostream>
#include <cstring>
using namespace std;

void mergeAlpha(char str[]) {

    int freq[26] = {0};
    int n = strlen(str);

    int i = 0;

    while (i < n) {

        char ch = str[i];
        i++;

        int num = 0;

        while (i < n && isdigit(str[i])) {
            num = num * 10 + (str[i] - '0');
            i++;
        }

        freq[ch - 'a'] += num;
    }

    for (int i = 0; i < 26; i++) {
        if (freq[i] > 0) {
            cout << char('a' + i) << " " << freq[i] << "\n";
        }
    }
}

int main() {
    char str[1005];
    cin >> str;
    mergeAlpha(str);

    return 0;
}