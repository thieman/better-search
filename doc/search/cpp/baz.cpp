// C++ program to demonstrate  
// accessing of data members  
  
#include <bits/stdc++.h> 
using namespace std; 
class Baz 
{ 
    // Access specifier 
    public: 
  
    // Data Members 
    string geekname; 
  
    // Member Functions() 
    void printname() 
    { 
       cout << "Geekname is: " << geekname; 
    } 
}; 
  
int main() { 
  
    // Declare an object of class geeks 
    Baz obj1; 
  
    // accessing data member 
    obj1.geekname = "Abhi"; 
  
    // accessing member function 
    obj1.printname(); 
    return 0; 
} 