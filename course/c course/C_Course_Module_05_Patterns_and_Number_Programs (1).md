# C Programming Course: Zero to Advanced

## Module 5: Pattern Printing and Number Programs
**Level:** Intermediate | **Questions:** 10

**Topics covered:** nested loops, row/column logic, spaces and stars, number patterns, Pascal's triangle, Armstrong, perfect and prime numbers.

**Before you start:**
- In every pattern problem, the **outer loop controls rows** and the **inner loop controls what is printed in each row**. Print `\n` after each row.
- Work out on paper: for row `i`, how many spaces and how many symbols are needed?
- **Output must match exactly.** Do not print trailing spaces at the end of any line, unless a problem says so.
- In the test cases below, outputs are shown in code blocks so that spaces are visible.

---

## Question 1: Right-Angled Star Triangle
**Difficulty:** Easy

**Problem Description:**
Read `N` and print a right-angled triangle of `*` with `N` rows. Row `i` contains exactly `i` stars with no spaces between them.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines forming the triangle.

**Constraints:** 1 ≤ N ≤ 50

**Example:**
```
Input:
5

Output:
*
**
***
****
*****
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
*
```
Test 2:
```
Input: 3
Output:
*
**
***
```
Test 3:
```
Input: 4
Output:
*
**
***
****
```

**Hint:** `for (i = 1; i <= n; i++) { for (j = 1; j <= i; j++) printf("*"); printf("\n"); }`

---

## Question 2: Inverted Star Triangle
**Difficulty:** Easy

**Problem Description:**
Read `N` and print an inverted right-angled triangle of `*`. Row 1 has `N` stars, row 2 has `N-1` stars, and so on until the last row has 1 star.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines forming the inverted triangle.

**Constraints:** 1 ≤ N ≤ 50

**Example:**
```
Input:
5

Output:
*****
****
***
**
*
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
*
```
Test 2:
```
Input: 3
Output:
***
**
*
```
Test 3:
```
Input: 4
Output:
****
***
**
*
```

**Hint:** In row `i`, the number of stars is `n - i + 1`.

---

## Question 3: Pyramid Pattern
**Difficulty:** Easy–Medium

**Problem Description:**
Read `N` and print a centered pyramid of `*` with `N` rows. Row `i` has `N - i` leading spaces followed by `2i - 1` stars. Do not print trailing spaces.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines forming the pyramid.

**Constraints:** 1 ≤ N ≤ 50

**Example:**
```
Input:
4

Output:
   *
  ***
 *****
*******
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
*
```
Test 2:
```
Input: 2
Output:
 *
***
```
Test 3:
```
Input: 3
Output:
  *
 ***
*****
```

**Hint:** Use two inner loops in each row: one for spaces and one for stars.

---

## Question 4: Diamond Pattern
**Difficulty:** Medium

**Problem Description:**
Read `N` and print a diamond of `*`. The upper half is a pyramid with `N` rows (as in Question 3), followed by an inverted pyramid of `N - 1` rows. The total number of lines is `2N - 1`.

**Input Format:** A single integer `N`.

**Output Format:** `2N - 1` lines forming the diamond, without trailing spaces.

**Constraints:** 1 ≤ N ≤ 30

**Example:**
```
Input:
3

Output:
  *
 ***
*****
 ***
  *
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
*
```
Test 2:
```
Input: 2
Output:
 *
***
 *
```
Test 3:
```
Input: 4
Output:
   *
  ***
 *****
*******
 *****
  ***
   *
```

**Hint:** Write the upper half with a loop from 1 to `N`, and the lower half with a loop from `N - 1` down to 1, reusing the same space/star formula.

---

## Question 5: Number Triangle
**Difficulty:** Easy

**Problem Description:**
Read `N` and print a triangle where row `i` contains the numbers `1, 2, ..., i` written together with no spaces.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines forming the number triangle.

**Constraints:** 1 ≤ N ≤ 9

**Example:**
```
Input:
5

Output:
1
12
123
1234
12345
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
1
```
Test 2:
```
Input: 3
Output:
1
12
123
```
Test 3:
```
Input: 4
Output:
1
12
123
1234
```

**Hint:** In the inner loop, print the column counter `j`, not `i`.

---

## Question 6: Floyd's Triangle
**Difficulty:** Easy–Medium

**Problem Description:**
Floyd's triangle is a right-angled triangle filled with consecutive natural numbers starting from 1. Row `i` contains `i` numbers. Print `N` rows with numbers separated by a single space.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines, with numbers separated by single spaces and no trailing space.

**Constraints:** 1 ≤ N ≤ 30

**Example:**
```
Input:
4

Output:
1
2 3
4 5 6
7 8 9 10
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
1
```
Test 2:
```
Input: 3
Output:
1
2 3
4 5 6
```
Test 3:
```
Input: 5
Output:
1
2 3
4 5 6
7 8 9 10
11 12 13 14 15
```

**Hint:** Keep one counter `num = 1` outside both loops and do `num++` after each print. To avoid a trailing space, print a space only when `j > 1`.

---

## Question 7: Pascal's Triangle
**Difficulty:** Medium

**Problem Description:**
Print the first `N` rows of Pascal's triangle. Each row starts and ends with 1, and every other number is the sum of the two numbers above it. Equivalently, row `r` (starting from 0) has the values `C(r, 0), C(r, 1), ..., C(r, r)`. Print each row left-aligned with numbers separated by a single space.

**Input Format:** A single integer `N`.

**Output Format:** `N` lines.

**Constraints:** 1 ≤ N ≤ 20

**Example:**
```
Input:
5

Output:
1
1 1
1 2 1
1 3 3 1
1 4 6 4 1
```

**Test Cases:**

Test 1:
```
Input: 1
Output:
1
```
Test 2:
```
Input: 3
Output:
1
1 1
1 2 1
```
Test 3:
```
Input: 6
Output:
1
1 1
1 2 1
1 3 3 1
1 4 6 4 1
1 5 10 10 5 1
```

**Hint:** Compute each value from the previous one in the same row: start with `c = 1`, then `c = c * (r - k) / (k + 1)` for the next `k`. Use `long long` to be safe.

---

## Question 8: Armstrong Number
**Difficulty:** Medium

**Problem Description:**
An Armstrong number of `d` digits is equal to the sum of each digit raised to the power `d`. For example, `153` has 3 digits and `1³ + 5³ + 3³ = 1 + 125 + 27 = 153`. Read a positive integer and check whether it is an Armstrong number.

**Input Format:** A single integer `n`.

**Output Format:** `Armstrong` or `Not Armstrong`

**Constraints:** 1 ≤ n ≤ 10^9

**Example:**
```
Input:
153

Output:
Armstrong
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `9474` | `Armstrong` |
| 2 | `123` | `Not Armstrong` |
| 3 | `5` | `Armstrong` |

*Working for test 1:* `9⁴ + 4⁴ + 7⁴ + 4⁴ = 6561 + 256 + 2401 + 256 = 9474`. Every single-digit number is an Armstrong number (test 3).

**Hint:** First count the digits (as in Module 4, Question 5). Then extract each digit and multiply it by itself `d` times using an inner loop. Avoid `pow()`, because floating-point rounding can give wrong answers.

---

## Question 9: Perfect Number
**Difficulty:** Medium

**Problem Description:**
A perfect number equals the sum of its proper divisors (all positive divisors except the number itself). For example, `6 = 1 + 2 + 3` and `28 = 1 + 2 + 4 + 7 + 14`. Read a positive integer and check whether it is perfect.

**Input Format:** A single integer `n`.

**Output Format:** `Perfect` or `Not Perfect`

**Constraints:** 1 ≤ n ≤ 10^6

**Example:**
```
Input:
6

Output:
Perfect
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `28` | `Perfect` |
| 2 | `12` | `Not Perfect` |
| 3 | `1` | `Not Perfect` |

*Working:* For `12`, the proper divisors are 1, 2, 3, 4, 6 and their sum is 16, which is not 12. For `1`, there are no proper divisors, so the sum is 0.

**Hint:** Loop `i` from 1 to `n / 2` and add `i` to the sum whenever `n % i == 0`.

---

## Question 10: Prime Numbers in a Range
**Difficulty:** Medium

**Problem Description:**
Read `N` and print all prime numbers from 1 to `N` (inclusive) on one line, separated by spaces. If there is no prime in the range, print `No primes found`.

**Input Format:** A single integer `N`.

**Output Format:** Space-separated primes in increasing order, or `No primes found`.

**Constraints:** 1 ≤ N ≤ 10000

**Example:**
```
Input:
20

Output:
2 3 5 7 11 13 17 19
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1` | `No primes found` |
| 2 | `10` | `2 3 5 7` |
| 3 | `30` | `2 3 5 7 11 13 17 19 23 29` |

**Hint:** Use an outer loop over `2..N` and an inner prime check up to the square root (Module 4, Question 9). Keep a `found` flag to handle the "No primes found" case.

---

## Module 5 Challenge Questions (Optional)

1. **Hollow Square:** Read `N` and print an `N × N` square of `*` whose inside is empty (spaces). (Example: `4` → `****`, `*  *`, `*  *`, `****` on four lines)
2. **Alphabet Triangle:** Print a triangle where row `i` repeats the `i`-th capital letter `i` times. (Example: `4` → `A`, `BB`, `CCC`, `DDDD`)
3. **Strong Number:** A number is strong if the sum of the factorials of its digits equals the number. (Example: `145` → `Strong`, since `1! + 4! + 5! = 1 + 24 + 120 = 145`)

---
*End of Module 5. Next: Module 6, Functions and Recursion.*
