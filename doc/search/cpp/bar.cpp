// C++ program to illustrate the 
// iterators in vector 
#include <iostream> 
#include <vector> 
  
using namespace std; 
  
int main() 
{ 
    vector<int> bar; 
  
    for (int i = 1; i <= 5; i++) 
        bar.push_back(i); 
  
    cout << "Output of begin and end: "; 
    for (auto i = bar.begin(); i != bar.end(); ++i) 
        cout << *i << " "; 
  
    cout << "\nOutput of cbegin and cend: "; 
    for (auto i = bar.cbegin(); i != bar.cend(); ++i) 
        cout << *i << " "; 
  
    cout << "\nOutput of rbegin and rend: "; 
    for (auto ir = bar.rbegin(); ir != bar.rend(); ++ir) 
        cout << *ir << " "; 
  
    cout << "\nOutput of crbegin and crend : "; 
    for (auto ir = bar.crbegin(); ir != bar.crend(); ++ir) 
        cout << *ir << " "; 
  
    return 0; 
} 