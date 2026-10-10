# C Programming Course: Zero to Advanced

## Module 4: Loops
**Level:** Beginner | **Questions:** 10

**Topics covered:** `for`, `while`, `do-while`, loop counters and accumulators, digit extraction, `break` and `continue`.

**Before you start:**
- Use `for` when you know how many times to repeat, `while` when you repeat until a condition changes, and `do-while` when the body must run at least once.
- Digit extraction pattern: `digit = n % 10; n = n / 10;`
- Large results (factorials, sums) can overflow `int`. Use `long long` with `%lld`.
- A missing update or wrong condition causes an infinite loop. Trace your loop by hand for a small input.

---

## Question 1: Print Numbers from 1 to N
**Difficulty:** Easy

**Problem Description:**
Read a positive integer `N` and print all integers from 1 to `N` in increasing order on a single line, separated by spaces.

**Input Format:** A single integer `N`.

**Output Format:** `N` space-separated integers on one line.

**Constraints:** 1 ≤ N ≤ 1000

**Example:**
```
Input:
5

Output:
1 2 3 4 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `1` |
| 2 | `10` | `1 2 3 4 5 6 7 8 9 10` |
| 3 | `3` | `1 2 3` |

**Hint:** `for (int i = 1; i <= n; i++) printf("%d ", i);`

---

## Question 2: Sum of the First N Natural Numbers
**Difficulty:** Easy

**Problem Description:**
Read a positive integer `N` and compute `1 + 2 + 3 + ... + N` using a loop (do not use the formula).

**Input Format:** A single integer `N`.

**Output Format:** `Sum = <value>`

**Constraints:** 1 ≤ N ≤ 100000

**Example:**
```
Input:
5

Output:
Sum = 15
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `Sum = 1` |
| 2 | `100` | `Sum = 5050` |
| 3 | `100000` | `Sum = 5000050000` |

**Hint:** In test case 3 the sum is larger than the `int` range, so declare `long long sum = 0;` and print with `%lld`.

---

## Question 3: Multiplication Table
**Difficulty:** Easy

**Problem Description:**
Read an integer `n` and print its multiplication table from 1 to 10, one line per multiple.

**Input Format:** A single integer `n`.

**Output Format:** Ten lines of the form `n x i = result`.

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5

Output:
5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
5 x 4 = 20
5 x 5 = 25
5 x 6 = 30
5 x 7 = 35
5 x 8 = 40
5 x 9 = 45
5 x 10 = 50
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `12` | First line `12 x 1 = 12`, last line `12 x 10 = 120` (10 lines total) |
| 2 | `1` | First line `1 x 1 = 1`, last line `1 x 10 = 10` |
| 3 | `1000` | First line `1000 x 1 = 1000`, last line `1000 x 10 = 10000` |

**Hint:** `printf("%d x %d = %d\n", n, i, n * i);` inside a loop from 1 to 10.

---

## Question 4: Factorial of a Number
**Difficulty:** Easy

**Problem Description:**
Read a non-negative integer `n` and print `n!` (the product of all integers from 1 to `n`). By definition, `0! = 1`.

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
| 2 | `10` | `Factorial = 3628800` |
| 3 | `20` | `Factorial = 2432902008176640000` |

**Hint:** Start with `long long fact = 1;` and multiply by `i` in a loop. `20!` is the largest factorial that fits in a signed 64-bit integer.

---

## Question 5: Count the Digits of a Number
**Difficulty:** Easy

**Problem Description:**
Read an integer (which may be negative or zero) and count how many digits it has. Ignore the minus sign. The number `0` has 1 digit.

**Input Format:** A single integer `n`.

**Output Format:** `Digits = <count>`

**Constraints:** -10^9 ≤ n ≤ 10^9

**Example:**
```
Input:
12345

Output:
Digits = 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `Digits = 1` |
| 2 | `-987` | `Digits = 3` |
| 3 | `1000000000` | `Digits = 10` |

**Hint:** Convert a negative number to positive first. A `do { count++; n /= 10; } while (n != 0);` loop handles the `0` case naturally.

---

## Question 6: Reverse a Number
**Difficulty:** Easy–Medium

**Problem Description:**
Read an integer and print its reverse. Leading zeros of the reversed number are dropped (for example, `1200` becomes `21`). A negative number stays negative.

**Input Format:** A single integer `n`.

**Output Format:** `Reverse = <value>`

**Constraints:** -10^9 ≤ n ≤ 10^9

**Example:**
```
Input:
1234

Output:
Reverse = 4321
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1200` | `Reverse = 21` |
| 2 | `-45` | `Reverse = -54` |
| 3 | `907` | `Reverse = 709` |

**Hint:** Repeat: `rev = rev * 10 + n % 10; n /= 10;`. Use `long long` for `rev` so that large inputs do not overflow.

---

## Question 7: Palindrome Number
**Difficulty:** Easy–Medium

**Problem Description:**
A palindrome number reads the same forward and backward. Read a non-negative integer and check whether it is a palindrome.

**Input Format:** A single integer `n`.

**Output Format:** `Palindrome` or `Not a Palindrome`

**Constraints:** 0 ≤ n ≤ 10^9

**Example:**
```
Input:
121

Output:
Palindrome
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1221` | `Palindrome` |
| 2 | `123` | `Not a Palindrome` |
| 3 | `10` | `Not a Palindrome` |

**Hint:** Store the original number, reverse a copy (as in Question 6), then compare. For `10`, the reverse is `1`, so it is not a palindrome.

---

## Question 8: Fibonacci Series
**Difficulty:** Easy–Medium

**Problem Description:**
The Fibonacci series starts with `0` and `1`, and each next term is the sum of the previous two. Read `N` and print the first `N` terms on one line, separated by spaces.

**Input Format:** A single integer `N`.

**Output Format:** `N` space-separated Fibonacci numbers.

**Constraints:** 1 ≤ N ≤ 50

**Example:**
```
Input:
7

Output:
0 1 1 2 3 5 8
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `0` |
| 2 | `2` | `0 1` |
| 3 | `10` | `0 1 1 2 3 5 8 13 21 34` |

**Hint:** Keep two variables `a = 0, b = 1`. In each step print `a`, compute `next = a + b`, then shift: `a = b; b = next;`. Use `long long`, since Fibonacci numbers grow fast.

---

## Question 9: Prime Number Check
**Difficulty:** Medium

**Problem Description:**
A prime number is greater than 1 and has no divisors other than 1 and itself. Read an integer and check whether it is prime. Your solution should be efficient: only test divisors up to the square root of `n`.

**Input Format:** A single integer `n`.

**Output Format:** `Prime` or `Not Prime`

**Constraints:** 1 ≤ n ≤ 10^9

**Example:**
```
Input:
29

Output:
Prime
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `Not Prime` |
| 2 | `91` | `Not Prime` |
| 3 | `999999937` | `Prime` |

**Hint:** Handle `n <= 1` first. Then loop `for (long long i = 2; i * i <= n; i++)` and stop with `break` as soon as `n % i == 0`. `91 = 7 × 13`, so it looks prime but is not. `999999937` is the largest prime below 10^9, and the loop runs only about 31,600 times.

---

## Question 10: `break` and `continue` in a Loop
**Difficulty:** Medium

**Problem Description:**
Read an integer `N`. Loop through the numbers from 1 to `N` and print the multiples of 7, following these rules:
- Use `continue` to skip numbers that are **not** multiples of 7.
- Also use `continue` to skip multiples of 7 that are divisible by 5 (such as 35 and 70).
- Use `break` to stop the loop as soon as 5 numbers have been printed.

If nothing is printed, output `No numbers found`.

**Input Format:** A single integer `N`.

**Output Format:** The printed numbers separated by spaces on one line, or `No numbers found`.

**Constraints:** 1 ≤ N ≤ 1000

**Example:**
```
Input:
100

Output:
7 14 21 28 42
```

*Working:* The multiples of 7 are 7, 14, 21, 28, 35, 42, ... 35 is skipped because it is divisible by 5. After printing 42, the count reaches 5, so the loop breaks.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `30` | `7 14 21 28` |
| 2 | `5` | `No numbers found` |
| 3 | `1000` | `7 14 21 28 42` |

**Hint:** Keep a counter `count`. After printing, do `count++;` and then `if (count == 5) break;`. Place the two `continue` checks at the top of the loop body.

---

## Module 4 Challenge Questions (Optional)

1. **Sum of Digits:** Read an integer and print the sum of its digits using a loop. (Example: `12345` → `Sum = 15`)
2. **Power Without `pow()`:** Read a base and a non-negative exponent, and compute `base^exponent` using a loop. (Example: `2 10` → `Result = 1024`)
3. **Collatz Sequence:** Start from `n`. If `n` is even, replace it with `n / 2`; if odd, replace it with `3n + 1`. Print the sequence until it reaches 1. (Example: `6` → `6 3 10 5 16 8 4 2 1`)

---
*End of Module 4. Next: Module 5, Pattern Printing and Number Programs.*
