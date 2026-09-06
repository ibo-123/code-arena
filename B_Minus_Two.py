t = int(input())

for _ in range(t):
    n = int(input())
    a = list(map(int, input().split()))

    odd = 0
    even_0 = 0  # a % 4 == 0
    even_2 = 0  # a % 4 == 2

    for x in a:
        if x % 2 == 1:
            odd += 1
        elif x % 4 == 0:
            even_0 += 1
        else:
            even_2 += 1

    print(max(odd, even_0, even_2))