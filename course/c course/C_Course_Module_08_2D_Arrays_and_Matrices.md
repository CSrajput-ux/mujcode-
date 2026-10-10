# C Programming Course: Zero to Advanced

## Module 8: 2D Arrays and Matrices
**Level:** Intermediate | **Questions:** 10

**Topics covered:** 2D array declaration and input, matrix arithmetic, transpose, row/column/diagonal sums, symmetry, spiral traversal, rotation, saddle points.

**Before you start:**
- Declare a 2D array with fixed bounds, e.g. `int a[20][20];`, and use only the first `rows × cols` portion.
- `a[i][j]` means row `i`, column `j` (both 0-indexed).
- For an `n × n` square matrix, the main diagonal is where `i == j`, and the secondary (anti) diagonal is where `i + j == n - 1`.
- To print a matrix, use a nested loop: outer loop for rows, inner loop for columns, with `\n` after each row.

---

## Question 1: Input and Print a Matrix
**Difficulty:** Easy

**Problem Description:**
Read the number of rows `r` and columns `c`, then read an `r × c` matrix and print it back in the same grid layout, with values in a row separated by single spaces.

**Input Format:** Line 1: `r c`. Next `r` lines: `c` integers each.

**Output Format:** `r` lines, each with `c` space-separated integers.

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
2 3
1 2 3
4 5 6

Output:
1 2 3
4 5 6
```

**Test Cases:**

Test 1:
```
Input:
2 3
1 2 3
4 5 6
Output:
1 2 3
4 5 6
```
Test 2:
```
Input:
1 1
7
Output:
7
```
Test 3:
```
Input:
3 2
1 2
3 4
5 6
Output:
1 2
3 4
5 6
```

**Hint:** Two nested `for` loops: `for (i = 0; i < r; i++) { for (j = 0; j < c; j++) scanf("%d", &a[i][j]); }`, and similarly to print.

---

## Question 2: Addition of Two Matrices
**Difficulty:** Easy

**Problem Description:**
Read two matrices of the same dimensions `r × c` and print their element-wise sum.

**Input Format:** Line 1: `r c`. Next `r` lines: matrix A. Next `r` lines: matrix B.

**Output Format:** The sum matrix, `r` lines of `c` space-separated integers.

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
2 2
1 2
3 4
5 6
7 8

Output:
6 8
10 12
```

**Test Cases:**

Test 1:
```
Input:
2 2
1 2
3 4
5 6
7 8
Output:
6 8
10 12
```
Test 2:
```
Input:
1 3
1 1 1
2 2 2
Output:
3 3 3
```
Test 3:
```
Input:
2 2
-1 -2
-3 -4
1 2
3 4
Output:
0 0
0 0
```

**Hint:** `sum[i][j] = a[i][j] + b[i][j];` in a nested loop.

---

## Question 3: Multiplication of Two Matrices
**Difficulty:** Medium

**Problem Description:**
Read matrix A of size `r1 × c1` and matrix B of size `r2 × c2`. If `c1 != r2`, print `Multiplication not possible`. Otherwise, compute and print the product matrix of size `r1 × c2`.

**Input Format:** Line 1: `r1 c1`. Next `r1` lines: matrix A. Next line: `r2 c2`. Next `r2` lines: matrix B.

**Output Format:** The product matrix, or `Multiplication not possible`.

**Constraints:** 1 ≤ r1, c1, r2, c2 ≤ 20

**Example:**
```
Input:
2 3
1 2 3
4 5 6
3 2
7 8
9 10
11 12

Output:
58 64
139 154
```

**Test Cases:**

Test 1:
```
(as example above)
Output:
58 64
139 154
```
Test 2:
```
Input:
1 2
1 2
1 2
3 3
Output:
Multiplication not possible
```
Test 3:
```
Input:
2 2
1 0
0 1
2 2
5 6
7 8
Output:
5 6
7 8
```

**Hint:** `result[i][j] = sum over k of a[i][k] * b[k][j]`. Initialize `result[i][j] = 0` before the innermost loop that computes the sum. Test 3 multiplies by the identity matrix, which should leave the other matrix unchanged.

---

## Question 4: Transpose of a Matrix
**Difficulty:** Easy–Medium

**Problem Description:**
Read a matrix of size `r × c` and print its transpose (a `c × r` matrix where rows and columns are swapped: `transpose[j][i] = original[i][j]`).

**Input Format:** Line 1: `r c`. Next `r` lines: the matrix.

**Output Format:** The transposed matrix, `c` lines of `r` space-separated integers.

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
2 3
1 2 3
4 5 6

Output:
1 4
2 5
3 6
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
1 4
1 2 3 4
Output:
1
2
3
4
```
Test 3:
```
Input:
3 1
5
6
7
Output:
5 6 7
```

**Hint:** Use a separate result array of size `c × r`, since transposing in place only works cleanly for square matrices.

---

## Question 5: Row-wise and Column-wise Sum
**Difficulty:** Easy

**Problem Description:**
Read a matrix of size `r × c`. Print the sum of each row, then the sum of each column.

**Input Format:** Line 1: `r c`. Next `r` lines: the matrix.

**Output Format:**
```
Row sums: <row1> <row2> ...
Column sums: <col1> <col2> ...
```

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
2 3
1 2 3
4 5 6

Output:
Row sums: 6 15
Column sums: 5 7 9
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
1 1
9
Output:
Row sums: 9
Column sums: 9
```
Test 3:
```
Input:
3 2
1 1
2 2
3 3
Output:
Row sums: 2 4 6
Column sums: 6 6
```

**Hint:** Row sum: fix `i`, loop `j` and accumulate. Column sum: fix `j`, loop `i` and accumulate.

---

## Question 6: Sum of Diagonals
**Difficulty:** Easy–Medium

**Problem Description:**
Read a square matrix of size `n × n`. Print the sum of the main diagonal (`i == j`) and the sum of the secondary diagonal (`i + j == n - 1`). If `n` is odd, the center element belongs to both diagonals and should be counted in both sums.

**Input Format:** Line 1: `n`. Next `n` lines: the matrix.

**Output Format:**
```
Main Diagonal Sum = <value>
Secondary Diagonal Sum = <value>
```

**Constraints:** 1 ≤ n ≤ 20

**Example:**
```
Input:
3
1 2 3
4 5 6
7 8 9

Output:
Main Diagonal Sum = 15
Secondary Diagonal Sum = 15
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
1
5
Output:
Main Diagonal Sum = 5
Secondary Diagonal Sum = 5
```
Test 3:
```
Input:
2
1 2
3 4
Output:
Main Diagonal Sum = 5
Secondary Diagonal Sum = 2
```

**Hint:** In a single loop over `i` from 0 to `n-1`, add `a[i][i]` to the main sum and `a[i][n-1-i]` to the secondary sum.

---

## Question 7: Check If a Matrix Is Symmetric
**Difficulty:** Medium

**Problem Description:**
Read a square matrix of size `n × n`. Check whether it is symmetric, meaning `a[i][j] == a[j][i]` for every `i` and `j`.

**Input Format:** Line 1: `n`. Next `n` lines: the matrix.

**Output Format:** `Symmetric` or `Not Symmetric`

**Constraints:** 1 ≤ n ≤ 20

**Example:**
```
Input:
3
1 2 3
2 4 5
3 5 6

Output:
Symmetric
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
2
1 2
3 4
Output:
Not Symmetric
```
Test 3:
```
Input:
1
7
Output:
Symmetric
```

**Hint:** You only need to compare the upper triangle against the lower triangle (`j > i`), which is more efficient, but comparing all pairs also works for these sizes.

---

## Question 8: Print a Matrix in Spiral Order
**Difficulty:** Medium–Hard

**Problem Description:**
Read a matrix of size `r × c` and print its elements in spiral order: starting from the top-left corner, go right across the top row, down the right column, left across the bottom row, up the left column, and continue spiraling inward.

**Input Format:** Line 1: `r c`. Next `r` lines: the matrix.

**Output Format:** All elements in spiral order, space-separated, on one line.

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
3 3
1 2 3
4 5 6
7 8 9

Output:
1 2 3 6 9 8 7 4 5
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
1 4
1 2 3 4
Output:
1 2 3 4
```
Test 3:
```
Input:
3 1
1
2
3
Output:
1 2 3
```

**Hint:** Maintain four boundaries: `top`, `bottom`, `left`, `right`. Traverse top row left-to-right, then right column top-to-bottom, then bottom row right-to-left (only if `top <= bottom` still holds), then left column bottom-to-top (only if `left <= right` still holds). Shrink the boundaries after each side and repeat until they cross.

---

## Question 9: Rotate a Matrix by 90 Degrees
**Difficulty:** Medium–Hard

**Problem Description:**
Read a square matrix of size `n × n` and print it rotated 90 degrees clockwise.

**Input Format:** Line 1: `n`. Next `n` lines: the matrix.

**Output Format:** The rotated matrix, `n` lines of `n` space-separated integers.

**Constraints:** 1 ≤ n ≤ 20

**Example:**
```
Input:
3
1 2 3
4 5 6
7 8 9

Output:
7 4 1
8 5 2
9 6 3
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
1
5
Output:
5
```
Test 3:
```
Input:
2
1 2
3 4
Output:
3 1
4 2
```

**Hint:** For a clockwise rotation, `rotated[j][n-1-i] = original[i][j]`. Use a separate result array; rotating in place is trickier and not required here.

---

## Question 10: Find the Saddle Point of a Matrix
**Difficulty:** Medium

**Problem Description:**
A saddle point is an element that is the **minimum** in its row and the **maximum** in its column. Read a matrix of size `r × c` and find a saddle point if one exists. If multiple exist, print the first one found (scanning row by row). If none exists, print `No saddle point`.

**Input Format:** Line 1: `r c`. Next `r` lines: the matrix.

**Output Format:** `Saddle point = <value>` or `No saddle point`.

**Constraints:** 1 ≤ r, c ≤ 20

**Example:**
```
Input:
3 3
9 8 7
6 5 4
3 2 1

Output:
Saddle point = 7
```

*Working:* `7` is the minimum in its row (`9 8 7`), and checking column 2 (`7, 4, 1`), `7` is the maximum. So `7` is a saddle point.

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
2 2
1 2
3 4
Output:
No saddle point
```
Test 3:
```
Input:
1 1
5
Output:
Saddle point = 5
```

**Hint:** For each row, find the row's minimum and its column index. Then check whether that value is also the maximum in that column. Stop at the first row where this succeeds.

---

## Module 8 Challenge Questions (Optional)

1. **Identity Matrix Check:** Check whether a square matrix is an identity matrix (1s on the main diagonal, 0s elsewhere). (Example: `[[1,0],[0,1]]` → `Yes`)
2. **Matrix Trace:** Print the trace (sum of main diagonal elements) of a square matrix, without using a separate function for the diagonal sum. (Example: `[[1,2],[3,4]]` → `Trace = 5`)
3. **Boundary Elements Sum:** Print the sum of all elements on the boundary (first/last row, first/last column) of a matrix. (Example: `3×3` matrix of `1..9` → `Sum = 40`, since only the center `5` is excluded)

---
*End of Module 8. Next: Module 9, Strings.*
