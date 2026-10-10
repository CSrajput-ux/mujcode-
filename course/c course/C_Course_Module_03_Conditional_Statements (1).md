# C Programming Course: Zero to Advanced

## Module 3: Conditional Statements
**Level:** Beginner | **Questions:** 10

**Topics covered:** `if`, `if-else`, `else if` ladder, nested `if`, `switch-case`, logical conditions, input validation.

**Before you start:**
- Any non-zero value is true in C, and `0` is false.
- Use `==` to compare and `=` to assign. `if (x = 5)` is a bug, not a comparison.
- In a `switch`, always add `break;` at the end of each case, or execution "falls through" to the next case.
- Use `scanf(" %c", &ch)` (with a space before `%c`) to skip leftover newline characters.

---

## Question 1: Positive, Negative or Zero
**Difficulty:** Easy

**Problem Description:**
Read an integer and check whether it is positive, negative or zero. Print the result.

**Input Format:** A single integer `n`.

**Output Format:** One of `Positive`, `Negative` or `Zero`.

**Constraints:** -10^9 ≤ n ≤ 10^9

**Example:**
```
Input:
5

Output:
Positive
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Positive` |
| 2 | `-3` | `Negative` |
| 3 | `0` | `Zero` |

**Hint:** Use an `if - else if - else` chain.

---

## Question 2: Even or Odd
**Difficulty:** Easy

**Problem Description:**
Read an integer and check whether it is even or odd. Your program must work correctly for negative numbers too.

**Input Format:** A single integer `n`.

**Output Format:** `Even` or `Odd`

**Constraints:** -10^9 ≤ n ≤ 10^9

**Example:**
```
Input:
10

Output:
Even
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10` | `Even` |
| 2 | `7` | `Odd` |
| 3 | `-7` | `Odd` |

**Hint:** In C, `-7 % 2` is `-1`, not `1`. So check `n % 2 == 0` for even and treat everything else as odd. Do not test `n % 2 == 1`.

---

## Question 3: Largest of Three Numbers
**Difficulty:** Easy

**Problem Description:**
Read three integers and print the largest one. Use nested `if` or logical operators. Your program should also work when two or all three values are equal.

**Input Format:** One line with three integers `a b c`.

**Output Format:** `Largest = <value>`

**Constraints:** -10^9 ≤ a, b, c ≤ 10^9

**Example:**
```
Input:
10 25 15

Output:
Largest = 25
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 25 15` | `Largest = 25` |
| 2 | `-1 -5 -3` | `Largest = -1` |
| 3 | `8 8 3` | `Largest = 8` |

**Hint:** Use `>=` in your comparisons so that equal values are handled correctly: `if (a >= b && a >= c)`.

---

## Question 4: Leap Year Checker
**Difficulty:** Easy–Medium

**Problem Description:**
Read a year and check whether it is a leap year.

**Rules:** A year is a leap year if it is divisible by 400, **or** if it is divisible by 4 but **not** divisible by 100.

**Input Format:** A single integer `year`.

**Output Format:** `Leap Year` or `Not a Leap Year`

**Constraints:** 1 ≤ year ≤ 9999

**Example:**
```
Input:
2024

Output:
Leap Year
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `2000` | `Leap Year` |
| 2 | `1900` | `Not a Leap Year` |
| 3 | `2023` | `Not a Leap Year` |

**Hint:** `(year % 400 == 0) || (year % 4 == 0 && year % 100 != 0)`. 1900 is divisible by 4 and 100 but not 400, so it is not a leap year.

---

## Question 5: Vowel or Consonant
**Difficulty:** Easy

**Problem Description:**
Read a single character. If it is an English letter, print whether it is a vowel or a consonant (uppercase and lowercase both count). If it is not a letter, print `Not a letter`.

**Input Format:** A single character `ch`.

**Output Format:** `Vowel`, `Consonant` or `Not a letter`

**Constraints:** `ch` is one visible ASCII character.

**Example:**
```
Input:
E

Output:
Vowel
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `a` | `Vowel` |
| 2 | `K` | `Consonant` |
| 3 | `5` | `Not a letter` |

**Hint:** First check whether the character is a letter (`ch >= 'a' && ch <= 'z'` or `ch >= 'A' && ch <= 'Z'`). Then check the vowels `a e i o u` in both cases.

---

## Question 6: Grade Calculator (if-else ladder)
**Difficulty:** Easy

**Problem Description:**
Read a student's marks and print the grade using this table.

| Marks | Grade |
|-------|-------|
| 90 – 100 | A |
| 80 – 89 | B |
| 70 – 79 | C |
| 60 – 69 | D |
| 40 – 59 | E |
| 0 – 39 | F |

If the marks are outside 0–100, print `Invalid marks`.

**Input Format:** A single integer `marks`.

**Output Format:** `Grade: <grade>` or `Invalid marks`

**Constraints:** -1000 ≤ marks ≤ 1000

**Example:**
```
Input:
95

Output:
Grade: A
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `72` | `Grade: C` |
| 2 | `40` | `Grade: E` |
| 3 | `101` | `Invalid marks` |

**Hint:** Check invalid marks first. Then test from the highest range downward (`>= 90`, `>= 80`, ...) so each condition stays short.

---

## Question 7: Roots of a Quadratic Equation
**Difficulty:** Medium

**Problem Description:**
Read the coefficients `a`, `b` and `c` of the equation `ax² + bx + c = 0` (with `a ≠ 0`). Compute the discriminant `D = b² - 4ac` and print the roots depending on its value.

- If `D > 0`: two distinct real roots, `(-b + √D) / 2a` and `(-b - √D) / 2a`.
- If `D = 0`: one repeated real root, `-b / 2a`.
- If `D < 0`: two complex roots, `real ± imaginary i`, where real = `-b / 2a` and imaginary = `√(-D) / 2a`.

Print all numbers with 2 decimal places.

**Input Format:** One line with three integers `a b c`.

**Output Format:**
- `D > 0`:
```
Roots are real and different
Root1 = <value>
Root2 = <value>
```
- `D = 0`:
```
Roots are real and equal
Root = <value>
```
- `D < 0`:
```
Roots are complex
Root1 = <real> + <imag>i
Root2 = <real> - <imag>i
```

**Constraints:** -100 ≤ a, b, c ≤ 100 and a > 0.

**Example:**
```
Input:
1 -5 6

Output:
Roots are real and different
Root1 = 3.00
Root2 = 2.00
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1 -5 6` | `Roots are real and different` <br> `Root1 = 3.00` <br> `Root2 = 2.00` |
| 2 | `1 -4 4` | `Roots are real and equal` <br> `Root = 2.00` |
| 3 | `1 2 5` | `Roots are complex` <br> `Root1 = -1.00 + 2.00i` <br> `Root2 = -1.00 - 2.00i` |

**Hint:** Include `<math.h>` and use `sqrt()`. With GCC, compile using `gcc file.c -lm`. Use `double` variables. If you get `-0.00` in output, add `0.0` to the value before printing.

---

## Question 8: Simple Calculator Using switch
**Difficulty:** Medium

**Problem Description:**
Build a calculator that reads two numbers and an operator (`+`, `-`, `*`, `/`) and prints the result using a `switch` statement. Handle two error cases:
- Division by zero: print `Error: Division by zero`
- Any other operator: print `Error: Invalid operator`

**Input Format:** One line in the format `num1 operator num2`, for example `10 + 5`.

**Output Format:** `Result = <value with 2 decimals>`, or one of the error messages.

**Constraints:** -10^6 ≤ num1, num2 ≤ 10^6

**Example:**
```
Input:
10 + 5

Output:
Result = 15.00
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `9 / 2` | `Result = 4.50` |
| 2 | `5 / 0` | `Error: Division by zero` |
| 3 | `6 % 4` | `Error: Invalid operator` |

**Hint:** Read with `scanf("%lf %c %lf", &a, &op, &b);`. Inside `case '/':`, use an `if (b == 0)` check before dividing. Do not forget `break;` and a `default:` case.

---

## Question 9: Day Name from Number
**Difficulty:** Easy

**Problem Description:**
Read a number from 1 to 7 and print the corresponding day of the week using `switch`, where 1 is Monday and 7 is Sunday. For any other number, print `Invalid day number`.

**Input Format:** A single integer `n`.

**Output Format:** The day name, or `Invalid day number`.

**Constraints:** -100 ≤ n ≤ 100

**Example:**
```
Input:
3

Output:
Wednesday
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `Monday` |
| 2 | `7` | `Sunday` |
| 3 | `9` | `Invalid day number` |

**Hint:** Write seven cases and a `default:` for invalid input.

---

## Question 10: Triangle Validity and Type
**Difficulty:** Medium

**Problem Description:**
Read the lengths of three sides of a triangle. First check whether they can form a valid triangle: the sum of any two sides must be **strictly greater** than the third side. If valid, print its type:
- **Equilateral:** all three sides are equal
- **Isosceles:** exactly two sides are equal
- **Scalene:** all three sides are different

**Input Format:** One line with three positive integers `a b c`.

**Output Format:** `Valid triangle: <type>` or `Not a valid triangle`.

**Constraints:** 1 ≤ a, b, c ≤ 10^4

**Example:**
```
Input:
5 5 5

Output:
Valid triangle: Equilateral
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 5 8` | `Valid triangle: Isosceles` |
| 2 | `3 4 5` | `Valid triangle: Scalene` |
| 3 | `1 2 3` | `Not a valid triangle` |

**Hint:** Check `a + b > c && a + c > b && b + c > a`. In test case 3, `1 + 2 = 3` is not strictly greater than 3, so it is invalid. Check for equilateral before isosceles.

---

## Module 3 Challenge Questions (Optional)

1. **Character Classifier:** Read one character and print whether it is an `Alphabet`, `Digit` or `Special character`. (Example: `#` → `Special character`)
2. **Electricity Bill:** Read the units consumed. Charge ₹5 per unit for the first 100, ₹7 per unit for the next 100, and ₹10 per unit above 200. Print the bill. (Example: `250` → `Bill = 1700`, since 500 + 700 + 500)
3. **Days in a Month:** Read a month number and a year, and print the number of days, considering leap years for February. (Example: `2 2024` → `29 days`)

---
*End of Module 3. Next: Module 4, Loops.*
