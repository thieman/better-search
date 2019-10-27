for i in range(1, 101):
    if i % 15 == 0:
        foo = "FizzBuzz"
    elif i % 3 == 0:
        foo = "Fizz"
    elif i % 5 == 0:
        foo = "Buzz"
    else:
        foo = i