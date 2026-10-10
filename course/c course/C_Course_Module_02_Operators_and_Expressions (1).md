# C Programming Course: Zero to Advanced

## Module 2: Operators and Expressions
**Level:** Beginner | **Questions:** 10

**Topics covered:** arithmetic operators, increment/decrement, relational and logical operators, ternary operator, type casting, bitwise operators, operator precedence.

**Before you start:**
- Integer division truncates toward zero: `7 / 2` is `3`, and `-9 / 4` is `-2`.
- `%` gives the remainder and works only on integers. In C99 and later, the result has the same sign as the left operand (`-9 % 4` is `-1`).
- Relational and logical expressions give `1` (true) or `0` (false).

---

## Question 1: Arithmetic Operators Demo
**Difficulty:** Easy

**Problem Description:**
Read two integers `a` and `b`. Print their sum, difference, product, quotient (integer division) and remainder using the operators `+`, `-`, `*`, `/` and `%`.

**Input Format:** One line with two integers `a` and `b`.

**Output Format:**
```
Sum = <a+b>
Difference = <a-b>
Product = <a*b>
Quotient = <a/b>
Remainder = <a%b>
```

**Constraints:** -10^4 ≤ a, b ≤ 10^4 and b ≠ 0.

**Example:**
```
Input:
17 5

Output:
Sum = 22
Difference = 12
Product = 85
Quotient = 3
Remainder = 2
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `17 5` | `Sum = 22` <br> `Difference = 12` <br> `Product = 85` <br> `Quotient = 3` <br> `Remainder = 2` |
| 2 | `20 4` | `Sum = 24` <br> `Difference = 16` <br> `Product = 80` <br> `Quotient = 5` <br> `Remainder = 0` |
| 3 | `-9 4` | `Sum = -5` <br> `Difference = -13` <br> `Product = -36` <br> `Quotient = -2` <br> `Remainder = -1` |

**Hint:** To print a literal `%` in `printf`, write `%%`. It is not needed here, but remember it for later.

---

## Question 2: Pre and Post Increment/Decrement
**Difficulty:** Easy–Medium

**Problem Description:**
Read an integer `x`. Using four copies of it, demonstrate the four operators `a++`, `++a`, `a--` and `--a`. For each, print the value that the expression **produced** (the "used" value) and the value of the variable **after** the operation (the "final" value).

- Post-increment `a++` gives the old value, then increases `a`.
- Pre-increment `++a` increases `a`, then gives the new value.

**Input Format:** A single integer `x`.

**Output Format:**
```
a++: used <v>, final <v>
++a: used <v>, final <v>
a--: used <v>, final <v>
--a: used <v>, final <v>
```

**Constraints:** -1000 ≤ x ≤ 1000. Each operator starts from a fresh copy of `x`.

**Example:**
```
Input:
5

Output:
a++: used 5, final 6
++a: used 6, final 6
a--: used 5, final 4
--a: used 4, final 4
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `a++: used 5, final 6` <br> `++a: used 6, final 6` <br> `a--: used 5, final 4` <br> `--a: used 4, final 4` |
| 2 | `0` | `a++: used 0, final 1` <br> `++a: used 1, final 1` <br> `a--: used 0, final -1` <br> `--a: used -1, final -1` |
| 3 | `-3` | `a++: used -3, final -2` <br> `++a: used -2, final -2` <br> `a--: used -3, final -4` <br> `--a: used -4, final -4` |

**Hint:** Do not write `printf("%d %d", a++, a);`. Modifying and reading the same variable in one statement is **undefined behaviour**. Store `used = a++;` in a separate statement, then print `used` and `a`.

---

## Question 3: Relational and Logical Operators
**Difficulty:** Easy

**Problem Description:**
Read three integers `a`, `b` and `c`. Evaluate the six expressions below and print the result of each (`1` for true, `0` for false).

**Input Format:** One line with three integers `a b c`.

**Output Format:**
```
a > b : <0/1>
a == b : <0/1>
a != b : <0/1>
(a > b) && (a > c) : <0/1>
(a > b) || (a > c) : <0/1>
!(a > b) : <0/1>
```

**Constraints:** -1000 ≤ a, b, c ≤ 1000

**Example:**
```
Input:
5 3 8

Output:
a > b : 1
a == b : 0
a != b : 1
(a > b) && (a > c) : 0
(a > b) || (a > c) : 1
!(a > b) : 0
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 3 8` | `1, 0, 1, 0, 1, 0` (one per line with labels) |
| 2 | `2 2 2` | `0, 1, 0, 0, 0, 1` |
| 3 | `10 20 5` | `0, 0, 1, 0, 1, 1` |

**Hint:** `&&` is true only when both sides are true. `||` is true when at least one side is true. `==` compares, `=` assigns, and mixing them up is a very common bug.

---

## Question 4: Largest of Two Numbers Using the Ternary Operator
**Difficulty:** Easy

**Problem Description:**
Read two integers and print the larger one using the ternary (conditional) operator `condition ? value_if_true : value_if_false`. Do not use `if-else`. If both numbers are equal, print that number.

**Input Format:** One line with two integers `a` and `b`.

**Output Format:** `Largest = <value>`

**Constraints:** -10^9 ≤ a, b ≤ 10^9

**Example:**
```
Input:
10 20

Output:
Largest = 20
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 20` | `Largest = 20` |
| 2 | `-5 -9` | `Largest = -5` |
| 3 | `7 7` | `Largest = 7` |

**Hint:** `max = (a > b) ? a : b;`

---

## Question 5: Type Casting
**Difficulty:** Easy–Medium

**Problem Description:**
Read two integers `a` and `b`, and one real number `x`. Print:
1. The result of integer division `a / b`.
2. The result of float division, by casting `a` to `float` before dividing, to 2 decimal places.
3. The value of `x` converted to `int` by a cast (the fractional part is discarded, not rounded).

**Input Format:** One line: `a b x`.

**Output Format:**
```
Integer division = <a/b>
Float division = <value with 2 decimals>
Truncated value = <(int)x>
```

**Constraints:** 1 ≤ a, b ≤ 1000 and -1000 ≤ x ≤ 1000.

**Example:**
```
Input:
7 2 9.99

Output:
Integer division = 3
Float division = 3.50
Truncated value = 9
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `7 2 9.99` | `Integer division = 3` <br> `Float division = 3.50` <br> `Truncated value = 9` |
| 2 | `10 4 -3.7` | `Integer division = 2` <br> `Float division = 2.50` <br> `Truncated value = -3` |
| 3 | `9 3 5.0` | `Integer division = 3` <br> `Float division = 3.00` <br> `Truncated value = 5` |

**Hint:** `(float)a / b` casts `a` first, so the division becomes a float division. `(float)(a / b)` casts too late, after the integer division has already happened.

---

## Question 6: Area and Perimeter of a Rectangle
**Difficulty:** Easy

**Problem Description:**
Read the length and width of a rectangle (real numbers). Calculate and print its area and perimeter with 2 decimal places.

**Formulas:** Area = length × width, Perimeter = 2 × (length + width)

**Input Format:** One line with two real numbers `length width`.

**Output Format:**
```
Area = <area>
Perimeter = <perimeter>
```

**Constraints:** 0 < length, width ≤ 10^4

**Example:**
```
Input:
5 3

Output:
Area = 15.00
Perimeter = 16.00
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 3` | `Area = 15.00` <br> `Perimeter = 16.00` |
| 2 | `10.5 2` | `Area = 21.00` <br> `Perimeter = 25.00` |
| 3 | `7 7` | `Area = 49.00` <br> `Perimeter = 28.00` |

**Hint:** Use `double` variables and `%.2lf`.

---

## Question 7: Sum of Digits of a 3-Digit Number (No Loop)
**Difficulty:** Easy–Medium

**Problem Description:**
Read a 3-digit positive integer and print the sum of its digits. Do not use any loop. Use only the `/` and `%` operators to separate the digits.

**Input Format:** A single integer `n`.

**Output Format:** `Sum of digits = <value>`

**Constraints:** 100 ≤ n ≤ 999

**Example:**
```
Input:
123

Output:
Sum of digits = 6
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `123` | `Sum of digits = 6` |
| 2 | `999` | `Sum of digits = 27` |
| 3 | `100` | `Sum of digits = 1` |

**Hint:** Units digit = `n % 10`, tens digit = `(n / 10) % 10`, hundreds digit = `n / 100`.

---

## Question 8: Convert Seconds to HH:MM:SS
**Difficulty:** Easy–Medium

**Problem Description:**
Read a total number of seconds and convert it into hours, minutes and seconds. Print the time in the `HH:MM:SS` format with each part padded with a leading zero to 2 digits.

**Input Format:** A single integer `S`.

**Output Format:** `HH:MM:SS`

**Constraints:** 0 ≤ S ≤ 86399

**Example:**
```
Input:
3661

Output:
01:01:01
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3661` | `01:01:01` |
| 2 | `7325` | `02:02:05` |
| 3 | `59` | `00:00:59` |

**Hint:** `hours = S / 3600; minutes = (S % 3600) / 60; seconds = S % 60;` Use `%02d` to pad with zeros.

---

## Question 9: Bitwise Operators Demo
**Difficulty:** Medium

**Problem Description:**
Read two non-negative integers `a` and `b`. Print the results of `a & b`, `a | b`, `a ^ b`, `~a`, `a << 1` and `a >> 1`.

**Input Format:** One line with two integers `a b`.

**Output Format:**
```
a & b = <value>
a | b = <value>
a ^ b = <value>
~a = <value>
a << 1 = <value>
a >> 1 = <value>
```

**Constraints:** 0 ≤ a, b ≤ 10^6

**Example:**
```
Input:
12 10

Output:
a & b = 8
a | b = 14
a ^ b = 6
~a = -13
a << 1 = 24
a >> 1 = 6
```

*Working:* 12 = `1100` and 10 = `1010`. AND = `1000` (8), OR = `1110` (14), XOR = `0110` (6). `~12 = -(12+1) = -13` in two's complement.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `12 10` | `8, 14, 6, -13, 24, 6` |
| 2 | `5 3` | `1, 7, 6, -6, 10, 2` |
| 3 | `0 15` | `0, 15, 15, -1, 0, 0` |

**Hint:** Left shift by 1 multiplies by 2. Right shift by 1 divides by 2 (for non-negative numbers). Also note that `~a` equals `-(a + 1)`.

---

## Question 10: Operator Precedence and Associativity
**Difficulty:** Medium

**Problem Description:**
Read four integers `a`, `b`, `c` and `d`. Evaluate and print these three expressions to see how precedence and parentheses change the result:

1. `a + b * c / d`
2. `(a + b) * c / d`
3. `a + b * (c / d)`

Remember that `*` and `/` have higher precedence than `+`, and they associate left to right. All divisions are integer divisions.

**Input Format:** One line with four integers `a b c d`.

**Output Format:**
```
a + b * c / d = <value>
(a + b) * c / d = <value>
a + b * (c / d) = <value>
```

**Constraints:** -1000 ≤ a, b, c ≤ 1000 and 1 ≤ d ≤ 1000.

**Example:**
```
Input:
10 5 3 2

Output:
a + b * c / d = 17
(a + b) * c / d = 22
a + b * (c / d) = 15
```

*Working:* (1) `5*3 = 15`, `15/2 = 7`, `10+7 = 17`. (2) `15*3 = 45`, `45/2 = 22`. (3) `3/2 = 1`, `5*1 = 5`, `10+5 = 15`.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 5 3 2` | `17, 22, 15` |
| 2 | `2 3 4 5` | `4, 4, 2` |
| 3 | `8 2 9 3` | `14, 30, 14` |

**Hint:** Work out each expression on paper, step by step, before you code it, and compare with your program's output.

---

## Module 2 Challenge Questions (Optional)

1. **Average of Three Numbers:** Read three integers and print their average with 2 decimals. (Example: `10 20 25` → `Average = 18.33`)
2. **Days to Years, Weeks, Days:** Read a number of days and convert it to years (365 days), weeks and remaining days. (Example: `400` → `1 years, 5 weeks, 0 days`)
3. **Even/Odd Using Bitwise AND:** Check whether a number is even or odd using only `n & 1`, with no `%`. (Example: `7` → `Odd`)

---
*End of Module 2. Next: Module 3, Conditional Statements.*
