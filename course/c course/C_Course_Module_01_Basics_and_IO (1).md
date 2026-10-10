# C Programming Course: Zero to Advanced

## Module 1: C Basics and Input/Output
**Level:** Beginner | **Questions:** 10

**Topics covered:** structure of a C program, `printf`, `scanf`, data types, `sizeof`, variables, format specifiers, basic arithmetic.

**Before you start:** Every program needs `#include <stdio.h>` and a `main()` function. Format specifiers: `%d` (int), `%f` (float), `%lf` (double), `%c` (char), `%s` (string).

---

## Question 1: Hello, World!
**Difficulty:** Easy

**Problem Description:**
Write a C program that prints two lines on the screen. The first line must be `Hello, World!` and the second line must be `Welcome to C Programming`. This is the traditional first program and checks that your compiler and environment work.

**Input Format:** No input.

**Output Format:** Two lines exactly as shown, each ending with a newline.

**Constraints:** Spelling, capital letters and punctuation must match exactly.

**Example:**
```
Output:
Hello, World!
Welcome to C Programming
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | (none) | `Hello, World!` <br> `Welcome to C Programming` |

*Note:* Since there is no input, the output is always the same. A common mistake is a missing `\n`, which puts both lines on one line.

**Hint:** Use `printf()` with `\n`.

---

## Question 2: Personal Information
**Difficulty:** Easy

**Problem Description:**
Read a person's first name (a single word), age (an integer) and city (a single word) from the user. Print the details in a formatted way using labels.

**Input Format:** One line with three space-separated values: `name age city`.

**Output Format:**
```
Name: <name>
Age: <age>
City: <city>
```

**Constraints:**
- Name and city have no spaces and at most 49 characters
- 1 ≤ age ≤ 120

**Example:**
```
Input:
Rahul 21 Jaipur

Output:
Name: Rahul
Age: 21
City: Jaipur
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Aisha 30 Delhi` | `Name: Aisha` <br> `Age: 30` <br> `City: Delhi` |
| 2 | `Vikram 45 Mumbai` | `Name: Vikram` <br> `Age: 45` <br> `City: Mumbai` |
| 3 | `Zoya 1 Pune` | `Name: Zoya` <br> `Age: 1` <br> `City: Pune` |

**Hint:** Use a `char` array such as `char name[50];` and `%s` in `scanf`. Do not put `&` before an array name.

---

## Question 3: Sum of Two Numbers
**Difficulty:** Easy

**Problem Description:**
Take two integers as input from the user, calculate their sum, and print the result. The numbers can be negative or zero.

**Input Format:** A single line with two space-separated integers `a` and `b`.

**Output Format:** Print one line: `Sum = <result>`

**Constraints:** -10^9 ≤ a, b ≤ 10^9 (use `long long` to stay safe).

**Example:**
```
Input:
5 7

Output:
Sum = 12
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 7` | `Sum = 12` |
| 2 | `-3 10` | `Sum = 7` |
| 3 | `1000000000 1000000000` | `Sum = 2000000000` |

**Hint:** In test case 3 the result is bigger than the range of `int` on many systems, so `long long` with `%lld` is safer.

---

## Question 4: Working with Different Data Types
**Difficulty:** Easy

**Problem Description:**
Declare one variable each of type `int`, `float`, `char` and `double`. Read values for them from the user and print each one on its own line with a label. Print the `float` with 2 decimal places and the `double` with 4 decimal places.

**Input Format:** One line: `int float char double` separated by spaces.

**Output Format:**
```
Integer: <value>
Float: <value with 2 decimals>
Character: <value>
Double: <value with 4 decimals>
```

**Constraints:** The char is a single visible character (not a space).

**Example:**
```
Input:
25 3.14159 A 2.718281

Output:
Integer: 25
Float: 3.14
Character: A
Double: 2.7183
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 1.5 x 9.87654` | `Integer: 10` <br> `Float: 1.50` <br> `Character: x` <br> `Double: 9.8765` |
| 2 | `-7 0.005 Z 100.0` | `Integer: -7` <br> `Float: 0.01` <br> `Character: Z` <br> `Double: 100.0000` |
| 3 | `0 99.999 # 0.00005` | `Integer: 0` <br> `Float: 100.00` <br> `Character: #` <br> `Double: 0.0001` |

**Hint:** Use `%.2f` and `%.4lf`. Because the char comes after a space, `scanf(" %c", &ch)` handles it safely. Note: rounding of values like `0.005` can vary slightly with floating-point representation, so use it only to understand rounding behaviour.

---

## Question 5: Size of Data Types
**Difficulty:** Easy

**Problem Description:**
Write a program that uses the `sizeof` operator to print the size in bytes of these data types: `char`, `short`, `int`, `long`, `long long`, `float`, `double`, `long double`.

**Input Format:** No input.

**Output Format:** One line per type in the format `<type>: <size> bytes`.

**Constraints:** Use `%zu` (or cast to `int` and use `%d`) to print the result of `sizeof`.

**Example (typical 64-bit Linux):**
```
Output:
char: 1 bytes
short: 2 bytes
int: 4 bytes
long: 8 bytes
long long: 8 bytes
float: 4 bytes
double: 8 bytes
long double: 16 bytes
```

**Test Cases:**

| # | Environment | Expected Output |
|---|-------------|-----------------|
| 1 | 64-bit Linux/macOS (GCC) | as in the example above |
| 2 | 64-bit Windows (MinGW) | same, except `long: 4 bytes` and `long double: 16 bytes` |

*Note:* Sizes depend on the compiler and system. Only `char` = 1 is guaranteed by the C standard.

**Hint:** `printf("int: %zu bytes\n", sizeof(int));`

---

## Question 6: Swap Two Numbers Using a Temporary Variable
**Difficulty:** Easy

**Problem Description:**
Read two integers `a` and `b`. Swap their values using a third temporary variable and print the values before and after the swap.

**Input Format:** One line with two integers `a` and `b`.

**Output Format:**
```
Before swap: a = <a>, b = <b>
After swap: a = <b>, b = <a>
```

**Constraints:** -10^9 ≤ a, b ≤ 10^9

**Example:**
```
Input:
10 20

Output:
Before swap: a = 10, b = 20
After swap: a = 20, b = 10
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 20` | `Before swap: a = 10, b = 20` <br> `After swap: a = 20, b = 10` |
| 2 | `-5 8` | `Before swap: a = -5, b = 8` <br> `After swap: a = 8, b = -5` |
| 3 | `0 0` | `Before swap: a = 0, b = 0` <br> `After swap: a = 0, b = 0` |

**Hint:** Think of two glasses of water: you need a third empty glass. `temp = a; a = b; b = temp;`

---

## Question 7: Swap Two Numbers Without a Temporary Variable
**Difficulty:** Easy–Medium

**Problem Description:**
Repeat the swap from Question 6, but do not use any third variable. Use arithmetic operations (addition and subtraction) to swap the values.

**Input Format:** One line with two integers `a` and `b`.

**Output Format:**
```
Before swap: a = <a>, b = <b>
After swap: a = <b>, b = <a>
```

**Constraints:** -10^9 ≤ a, b ≤ 10^9. Use `long long` variables so that `a + b` does not overflow.

**Example:**
```
Input:
15 40

Output:
Before swap: a = 15, b = 40
After swap: a = 40, b = 15
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `15 40` | `Before swap: a = 15, b = 40` <br> `After swap: a = 40, b = 15` |
| 2 | `-100 100` | `Before swap: a = -100, b = 100` <br> `After swap: a = 100, b = -100` |
| 3 | `7 7` | `Before swap: a = 7, b = 7` <br> `After swap: a = 7, b = 7` |

**Hint:** `a = a + b; b = a - b; a = a - b;` Trace it with a = 15, b = 40 on paper first.

---

## Question 8: Area and Circumference of a Circle
**Difficulty:** Easy

**Problem Description:**
Read the radius of a circle (a real number). Calculate and print its area and circumference. Use π = 3.14159. Print both results rounded to 2 decimal places.

**Formulas:** Area = π × r × r, Circumference = 2 × π × r

**Input Format:** A single real number `r`.

**Output Format:**
```
Area = <area>
Circumference = <circumference>
```

**Constraints:** 0 < r ≤ 1000

**Example:**
```
Input:
5

Output:
Area = 78.54
Circumference = 31.42
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Area = 78.54` <br> `Circumference = 31.42` |
| 2 | `1.5` | `Area = 7.07` <br> `Circumference = 9.42` |
| 3 | `10` | `Area = 314.16` <br> `Circumference = 62.83` |

**Hint:** Use `#define PI 3.14159` and the `double` type with `%.2lf`.

---

## Question 9: Celsius to Fahrenheit Converter
**Difficulty:** Easy

**Problem Description:**
Read a temperature in degrees Celsius and convert it to Fahrenheit. Print the result with 2 decimal places.

**Formula:** F = (C × 9 / 5) + 32

**Input Format:** A single real number `C`.

**Output Format:** `Fahrenheit = <value>`

**Constraints:** -273.15 ≤ C ≤ 10000

**Example:**
```
Input:
37

Output:
Fahrenheit = 98.60
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `0` | `Fahrenheit = 32.00` |
| 2 | `100` | `Fahrenheit = 212.00` |
| 3 | `-40` | `Fahrenheit = -40.00` |

**Hint:** Write `9.0 / 5.0` and not `9 / 5`. Integer division gives 1 and breaks the answer.

---

## Question 10: Simple Interest Calculator
**Difficulty:** Easy

**Problem Description:**
Read the principal amount `P`, the annual rate of interest `R` (in percent) and the time `T` (in years). Calculate the simple interest and the total amount to be paid. Print both with 2 decimal places.

**Formulas:** Simple Interest = (P × R × T) / 100, Total Amount = P + Simple Interest

**Input Format:** One line with three real numbers: `P R T`.

**Output Format:**
```
Simple Interest = <SI>
Total Amount = <amount>
```

**Constraints:** 0 < P ≤ 10^7, 0 < R ≤ 100, 0 < T ≤ 50

**Example:**
```
Input:
1000 5 2

Output:
Simple Interest = 100.00
Total Amount = 1100.00
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1000 5 2` | `Simple Interest = 100.00` <br> `Total Amount = 1100.00` |
| 2 | `5000 7.5 3` | `Simple Interest = 1125.00` <br> `Total Amount = 6125.00` |
| 3 | `2500 4 1.5` | `Simple Interest = 150.00` <br> `Total Amount = 2650.00` |

**Hint:** Use `double` for all variables.

---

## Module 1 Challenge Questions (Optional)

1. **Digit Extractor:** Read a 2-digit number and print its tens digit and units digit separately. (Example: `47` → `Tens = 4, Units = 7`)
2. **Rupees to Dollars:** Read an amount in rupees and an exchange rate, and print the amount in dollars with 2 decimals. (Example: `8300 83` → `Dollars = 100.00`)
3. **Compound Interest:** Extend Question 10 to compute compound interest using `pow()` from `<math.h>`. (Example: P = 1000, R = 10, T = 2 → `Compound Interest = 210.00`)

---
*End of Module 1. Next: Module 2, Operators and Expressions.*
