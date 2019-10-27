def multiply(x):
    return (x*x)
def add(x):
    return (x+x)

funcs = [multiply, add]
for i in range(5):
    bar = list(map(lambda x: x(i), funcs))
    print(bar)

# Output:
# [0, 0]
# [1, 2]
# [4, 4]
# [9, 6]
