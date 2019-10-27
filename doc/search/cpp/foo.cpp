#include <stdio.h> 
void foo(int x) 
{ 
   x = 30; 
} 
  
int main(void) 
{ 
    int x = 20; 
    foo(x); 
    printf("x = %d", x); 
    return 0; 
}  