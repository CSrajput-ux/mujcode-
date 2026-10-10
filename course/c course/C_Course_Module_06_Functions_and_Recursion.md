# C Programming Course: Zero to Advanced

## Module 6: Functions and Recursion
**Level:** Intermediate | **Questions:** 10

**Topics covered:** function declaration/definition/call, return values, call by value, recursion, base case and recursive case, multiple return via pointers (preview), classic recursive algorithms.

**Before you start:**
- A function needs a **declaration/prototype**, a **definition**, and a **call**.
- In C, arguments are passed **by value** by default: the function gets a copy, so changes inside it do not affect the caller's variable (unless you pass a pointer).
- Every recursive function needs a **base case** (to stop) and a **recursive case** (that moves toward the base case). Without a proper base case you get infinite recursion and a stack overflow crash.
- Trace recursion using a call stack diagram on paper before coding it.

---

## Question 1: Basic Arithmetic Functions
**Difficulty:** Easy

**Problem Description:**
Write four functions `add`, `subtract`, `multiply` and `divide`, each taking two `double` parameters and returning a `double`. Read two numbers and print the result of all four operations. For division, if the second number is 0, print `Division by zero` instead of a number.

**Input Format:** One line with two real numbers `a b`.

**Output Format:**
```
Add = <value>
Subtract = <value>
Multiply = <value>
Divide = <value or "Division by zero">
```
All numeric results with 2 decimal places.

**Constraints:** -10^6 ≤ a, b ≤ 10^6

**Example:**
```
Input:
10 4

Output:
Add = 14.00
Subtract = 6.00
Multiply = 40.00
Divide = 2.50
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 4` | `Add = 14.00` <br> `Subtract = 6.00` <br> `Multiply = 40.00` <br> `Divide = 2.50` |
| 2 | `5 0` | `Add = 5.00` <br> `Subtract = 5.00` <br> `Multiply = 0.00` <br> `Divide = Division by zero` |
| 3 | `-3 -6` | `Add = -9.00` <br> `Subtract = 3.00` <br> `Multiply = 18.00` <br> `Divide = 0.50` |

**Hint:** Declare all four prototypes above `main()`: `double add(double a, double b);` and so on.

---

## Question 2: Check Prime Using a Function
**Difficulty:** Easy–Medium

**Problem Description:**
Write a function `int isPrime(int n)` that returns `1` if `n` is prime and `0` otherwise. Call it from `main()` for a number read from input.

**Input Format:** A single integer `n`.

**Output Format:** `Prime` or `Not Prime`

**Constraints:** 1 ≤ n ≤ 10^6

**Example:**
```
Input:
17

Output:
Prime
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `17` | `Prime` |
| 2 | `1` | `Not Prime` |
| 3 | `100` | `Not Prime` |

**Hint:** Reuse the efficient square-root check from Module 4. The function should return, not print.

---

## Question 3: Call by Value (Swap That Does Not Work)
**Difficulty:** Easy–Medium

**Problem Description:**
Write a function `void swap(int a, int b)` that swaps its two parameters internally (print their values before and after inside the function). Call it from `main()` on two variables, then print the variables in `main()` afterward to show that **they did not change**. This demonstrates call by value.

**Input Format:** One line with two integers `a b`.

**Output Format:**
```
Inside function before swap: a = <a>, b = <b>
Inside function after swap: a = <b>, b = <a>
In main after function call: x = <original a>, y = <original b>
```

**Constraints:** -1000 ≤ a, b ≤ 1000

**Example:**
```
Input:
5 10

Output:
Inside function before swap: a = 5, b = 10
Inside function after swap: a = 10, b = 5
In main after function call: x = 5, y = 10
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 10` | (as example above) |
| 2 | `-1 1` | `Inside function before swap: a = -1, b = 1` <br> `Inside function after swap: a = 1, b = -1` <br> `In main after function call: x = -1, y = 1` |
| 3 | `0 0` | `Inside function before swap: a = 0, b = 0` <br> `Inside function after swap: a = 0, b = 0` <br> `In main after function call: x = 0, y = 0` |

**Hint:** This is intentional and correct behaviour — the key learning point is that `x` and `y` in `main()` stay unchanged because the function only received copies. (Module 10 will show how pointers fix this.)

---

## Question 4: Factorial Using Recursion
**Difficulty:** Easy–Medium

**Problem Description:**
Write a recursive function `long long factorial(int n)` that returns `n!`. Base case: `factorial(0) = 1`.

**Input Format:** A single integer `n`.

**Output Format:** `Factorial = <value>`

**Constraints:** 0 ≤ n ≤ 20

**Example:**
```
Input:
5

Output:
Factorial = 120
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `Factorial = 1` |
| 2 | `1` | `Factorial = 1` |
| 3 | `15` | `Factorial = 1307674368000` |

**Hint:** `return n <= 1 ? 1 : n * factorial(n - 1);`

---

## Question 5: Fibonacci Using Recursion
**Difficulty:** Medium

**Problem Description:**
Write a recursive function `long long fib(int n)` that returns the `n`-th Fibonacci number, with `fib(0) = 0` and `fib(1) = 1`.

**Input Format:** A single integer `n`.

**Output Format:** `Fibonacci(n) = <value>`

**Constraints:** 0 ≤ n ≤ 40

**Example:**
```
Input:
6

Output:
Fibonacci(6) = 8
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `Fibonacci(0) = 0` |
| 2 | `1` | `Fibonacci(1) = 1` |
| 3 | `10` | `Fibonacci(10) = 55` |

**Hint:** `return (n <= 1) ? n : fib(n - 1) + fib(n - 2);`. Note that plain recursive Fibonacci is exponential in time — `n = 40` already takes a noticeable moment. This is a good point to mention memoization as a future optimization, without implementing it here.

---

## Question 6: Sum of Digits Using Recursion
**Difficulty:** Medium

**Problem Description:**
Write a recursive function `int digitSum(int n)` that returns the sum of the digits of `n`. Assume `n` is non-negative.

**Input Format:** A single integer `n`.

**Output Format:** `Digit Sum = <value>`

**Constraints:** 0 ≤ n ≤ 10^9

**Example:**
```
Input:
12345

Output:
Digit Sum = 15
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `Digit Sum = 0` |
| 2 | `9999` | `Digit Sum = 36` |
| 3 | `1000000000` | `Digit Sum = 1` |

**Hint:** `return (n == 0) ? 0 : (n % 10) + digitSum(n / 10);`

---

## Question 7: Power Function Using Recursion
**Difficulty:** Medium

**Problem Description:**
Write a recursive function `long long power(int base, int exp)` that returns `base^exp`. Assume `exp ≥ 0`.

**Input Format:** One line with two integers `base exp`.

**Output Format:** `Result = <value>`

**Constraints:** -100 ≤ base ≤ 100, 0 ≤ exp ≤ 18

**Example:**
```
Input:
3 4

Output:
Result = 81
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `2 0` | `Result = 1` |
| 2 | `-2 3` | `Result = -8` |
| 3 | `5 10` | `Result = 9765625` |

**Hint:** `return (exp == 0) ? 1 : base * power(base, exp - 1);`. As a bonus, try fast exponentiation: `power(base, exp/2)` squared, halving `exp` each time.

---

## Question 8: GCD and LCM
**Difficulty:** Medium

**Problem Description:**
Write a recursive function to find the GCD of two positive integers using the Euclidean algorithm: `gcd(a, 0) = a`, otherwise `gcd(a, b) = gcd(b, a % b)`. Then compute the LCM using the identity `LCM(a, b) = (a * b) / GCD(a, b)`.

**Input Format:** One line with two positive integers `a b`.

**Output Format:**
```
GCD = <value>
LCM = <value>
```

**Constraints:** 1 ≤ a, b ≤ 10^6

**Example:**
```
Input:
12 18

Output:
GCD = 6
LCM = 36
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `12 18` | `GCD = 6` <br> `LCM = 36` |
| 2 | `7 13` | `GCD = 1` <br> `LCM = 91` |
| 3 | `100 100` | `GCD = 100` <br> `LCM = 100` |

**Hint:** Use `long long` for the LCM calculation (`a * b` can be large) to avoid overflow: `(long long)a * b / gcd`.

---

## Question 9: Decimal to Binary Using Recursion
**Difficulty:** Medium

**Problem Description:**
Write a recursive function that prints the binary representation of a non-negative decimal integer. Do not use arrays; print each bit as the recursion unwinds.

**Input Format:** A single integer `n`.

**Output Format:** The binary representation, with no leading zeros (except that `0` itself prints as `0`).

**Constraints:** 0 ≤ n ≤ 10^9

**Example:**
```
Input:
13

Output:
1101
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `0` |
| 2 | `8` | `1000` |
| 3 | `255` | `11111111` |

**Hint:** `void toBinary(int n) { if (n > 1) toBinary(n / 2); printf("%d", n % 2); }`. Recursing first, then printing, naturally produces the bits in the correct left-to-right order. Handle `n == 0` as a special case before calling the function.

---

## Question 10: Tower of Hanoi
**Difficulty:** Medium–Hard

**Problem Description:**
In the Tower of Hanoi puzzle, `N` disks must be moved from a source rod to a destination rod, using an auxiliary rod, following these rules: only one disk moves at a time, and a larger disk can never sit on top of a smaller disk. Write a recursive function that prints each move, and also print the total number of moves at the end.

**Input Format:** A single integer `N` (number of disks). Rods are named `A` (source), `B` (auxiliary) and `C` (destination).

**Output Format:** One line per move, in the format `Move disk <k> from A to C` (rod letters depend on the move). After all moves, print `Total moves = <count>`.

**Constraints:** 1 ≤ N ≤ 15

**Example:**
```
Input:
2

Output:
Move disk 1 from A to B
Move disk 2 from A to C
Move disk 1 from B to C
Total moves = 3
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
Move disk 1 from A to C
Total moves = 1
```
Test 2:
```
Input: 3
Output:
Move disk 1 from A to C
Move disk 2 from A to B
Move disk 1 from C to B
Move disk 3 from A to C
Move disk 1 from B to A
Move disk 2 from B to C
Move disk 1 from A to C
Total moves = 7
```
Test 3:
```
Input: 2
(as shown in the example above, Total moves = 3)
```

**Hint:** `hanoi(n, from, to, aux)`: if `n == 1`, move directly and return. Otherwise, `hanoi(n-1, from, aux, to)`, move disk `n` from `from` to `to`, then `hanoi(n-1, aux, to, from)`. The total number of moves is always `2^N - 1`.

---

## Module 6 Challenge Questions (Optional)

1. **Sum of an Array Using Recursion:** Write a recursive function that returns the sum of all elements of an array. (Example: `[1,2,3,4]` → `10`)
2. **Recursive Palindrome Check on a String:** Check whether a string is a palindrome by comparing the first and last characters and recursing inward. (Example: `"madam"` → `Palindrome`)
3. **Mutual Recursion:** Write two functions `isEven` and `isOdd` that call each other recursively to determine whether a number is even or odd (no `%` operator allowed). (Example: `7` → `Odd`)

---
*End of Module 6. Next: Module 7, Arrays (1D).*
