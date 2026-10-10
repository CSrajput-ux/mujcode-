# C Programming Course: Zero to Advanced

## Module 7: Arrays (1D)
**Level:** Intermediate | **Questions:** 10

**Topics covered:** array declaration and input, traversal, searching, sorting basics, rotation, merging, frequency counting.

**Before you start:**
- Arrays in C are indexed from `0` to `size - 1`. Accessing `arr[size]` or beyond is undefined behaviour (it will not always crash, but it is always wrong).
- Declare a fixed-size array with an upper bound, e.g. `int arr[1000];`, and only use the first `n` elements.
- Passing an array to a function passes a pointer to its first element, so the function can modify the caller's array directly — you must also pass its size.

---

## Question 1: Input and Print an Array
**Difficulty:** Easy

**Problem Description:**
Read an integer `n`, then read `n` integers into an array, and print them back separated by spaces.

**Input Format:** First line: `n`. Second line: `n` space-separated integers.

**Output Format:** The `n` integers separated by spaces on one line.

**Constraints:** 1 ≤ n ≤ 1000, -10^6 ≤ each element ≤ 10^6

**Example:**
```
Input:
5
10 20 30 40 50

Output:
10 20 30 40 50
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `10 20 30 40 50` | `10 20 30 40 50` |
| 2 | `1` / `7` | `7` |
| 3 | `4` / `-1 -2 -3 -4` | `-1 -2 -3 -4` |

**Hint:** `for (i = 0; i < n; i++) scanf("%d", &arr[i]);`

---

## Question 2: Sum and Average of an Array
**Difficulty:** Easy

**Problem Description:**
Read `n` integers into an array. Compute and print their sum and average. Print the average with 2 decimal places.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:**
```
Sum = <value>
Average = <value>
```

**Constraints:** 1 ≤ n ≤ 1000, -10^4 ≤ each element ≤ 10^4

**Example:**
```
Input:
4
10 20 30 40

Output:
Sum = 100
Average = 25.00
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `4` / `10 20 30 40` | `Sum = 100` <br> `Average = 25.00` |
| 2 | `3` / `-5 5 10` | `Sum = 10` <br> `Average = 3.33` |
| 3 | `1` / `7` | `Sum = 7` <br> `Average = 7.00` |

**Hint:** `average = (double) sum / n;` — cast before dividing, or the result will be truncated to an integer.

---

## Question 3: Largest and Smallest Element
**Difficulty:** Easy

**Problem Description:**
Read `n` integers into an array and find the largest and smallest elements without using any library sort function.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:**
```
Largest = <value>
Smallest = <value>
```

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
3 7 1 9 4

Output:
Largest = 9
Smallest = 1
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `3 7 1 9 4` | `Largest = 9` <br> `Smallest = 1` |
| 2 | `1` / `42` | `Largest = 42` <br> `Smallest = 42` |
| 3 | `4` / `-5 -1 -9 -3` | `Largest = -1` <br> `Smallest = -9` |

**Hint:** Initialize both `largest` and `smallest` to `arr[0]`, then compare against the rest of the array — do not initialize them to `0`, or negative-only arrays (test 3) will give a wrong answer.

---

## Question 4: Reverse an Array
**Difficulty:** Easy–Medium

**Problem Description:**
Read `n` integers into an array and print them in reverse order. Do this in place (swap elements from both ends), not by printing with a reverse loop only.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** The reversed array, space-separated.

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
1 2 3 4 5

Output:
5 4 3 2 1
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` | `5 4 3 2 1` |
| 2 | `1` / `9` | `9` |
| 3 | `4` / `10 20 30 40` | `40 30 20 10` |

**Hint:** Use two pointers `left = 0` and `right = n - 1`, swap `arr[left]` and `arr[right]`, and move both inward until `left >= right`.

---

## Question 5: Linear Search
**Difficulty:** Easy

**Problem Description:**
Read `n` integers into an array, then read a target value `key`. Search for `key` using linear search. If found, print its index (0-based). If it appears multiple times, print the **first** index. If not found, print `-1`.

**Input Format:** First line: `n`. Second line: `n` integers. Third line: `key`.

**Output Format:** `Index = <value>`

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
4 8 15 16 23
15

Output:
Index = 2
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `4 8 15 16 23` / `15` | `Index = 2` |
| 2 | `4` / `1 2 3 4` / `9` | `Index = -1` |
| 3 | `5` / `5 5 5 5 5` / `5` | `Index = 0` |

**Hint:** Break out of the loop as soon as a match is found, so you keep the first occurrence's index.

---

## Question 6: Second Largest Element
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into an array and find the second largest **distinct** value. If all elements are equal (there is no second distinct value), print `No second largest element`. Do this in a single pass without sorting.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** `Second Largest = <value>` or `No second largest element`.

**Constraints:** 2 ≤ n ≤ 1000

**Example:**
```
Input:
5
12 35 1 10 34

Output:
Second Largest = 34
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `12 35 1 10 34` | `Second Largest = 34` |
| 2 | `4` / `7 7 7 7` | `No second largest element` |
| 3 | `3` / `10 10 20` | `Second Largest = 10` |

**Hint:** Keep two trackers, `first` and `second`, both starting at the smallest possible value. When `arr[i] > first`, shift `first` into `second` before updating `first`. Update `second` only when `arr[i]` is strictly between `second` and `first`.

---

## Question 7: Find Duplicate Elements
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into an array and print every value that appears more than once, in the order it is first repeated, without printing any value twice in the output. If there are no duplicates, print `No duplicates found`.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** Space-separated duplicate values, or `No duplicates found`.

**Constraints:** 1 ≤ n ≤ 1000, 0 ≤ each element ≤ 1000

**Example:**
```
Input:
7
1 2 3 2 4 3 5

Output:
2 3
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `7` / `1 2 3 2 4 3 5` | `2 3` |
| 2 | `4` / `1 2 3 4` | `No duplicates found` |
| 3 | `5` / `9 9 9 9 9` | `9` |

**Hint:** Use a `count[1001]` frequency array (since elements are bounded by 1000), initialized to 0. Then walk through the original array once, and print a value only the first time its count reaches exactly 2.

---

## Question 8: Rotate an Array by K Positions
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into an array and an integer `k`. Rotate the array to the **left** by `k` positions and print the result. `k` may be larger than `n`.

**Input Format:** First line: `n`. Second line: `n` integers. Third line: `k`.

**Output Format:** The rotated array, space-separated.

**Constraints:** 1 ≤ n ≤ 1000, 0 ≤ k ≤ 10^6

**Example:**
```
Input:
5
1 2 3 4 5
2

Output:
3 4 5 1 2
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` / `2` | `3 4 5 1 2` |
| 2 | `4` / `1 2 3 4` / `0` | `1 2 3 4` |
| 3 | `3` / `1 2 3` / `7` | `2 3 1` |

**Hint:** First reduce `k` with `k = k % n` (test 3: `7 % 3 = 1`). Then build a new array where `new[i] = old[(i + k) % n]`, or use a temporary array and copy in two chunks.

---

## Question 9: Merge Two Sorted Arrays
**Difficulty:** Medium

**Problem Description:**
Read two arrays that are each already sorted in ascending order, and merge them into a single sorted array without using any library sort function.

**Input Format:** Line 1: `n1`. Line 2: `n1` sorted integers. Line 3: `n2`. Line 4: `n2` sorted integers.

**Output Format:** The merged sorted array, space-separated, containing `n1 + n2` elements.

**Constraints:** 0 ≤ n1, n2 ≤ 1000

**Example:**
```
Input:
3
1 3 5
3
2 4 6

Output:
1 2 3 4 5 6
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3` / `1 3 5` / `3` / `2 4 6` | `1 2 3 4 5 6` |
| 2 | `0` / (empty line) / `2` / `1 2` | `1 2` |
| 3 | `4` / `1 2 3 4` / `2` / `5 6` | `1 2 3 4 5 6` |

**Hint:** Use the two-pointer merge technique from merge sort: compare the current elements of both arrays and pick the smaller one, then advance that pointer. After one array is exhausted, copy the rest of the other array directly.

---

## Question 10: Frequency of Each Element
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into an array and print the frequency (count) of each **distinct** value, in the order each value first appears.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** One line per distinct value: `value: count`

**Constraints:** 1 ≤ n ≤ 1000, 0 ≤ each element ≤ 1000

**Example:**
```
Input:
6
4 2 4 5 2 4

Output:
4: 3
2: 2
5: 1
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `6` / `4 2 4 5 2 4` | `4: 3` <br> `2: 2` <br> `5: 1` |
| 2 | `1` / `9` | `9: 1` |
| 3 | `5` / `1 1 1 1 1` | `1: 5` |

**Hint:** Use a `visited[1001]` boolean array. For each index `i` not yet visited, count how many times `arr[i]` occurs in the rest of the array, print it, then mark all those positions visited so the same value is not printed again.

---

## Module 7 Challenge Questions (Optional)

1. **Move All Zeros to the End:** Rearrange an array so all non-zero elements keep their relative order at the front, followed by all zeros. (Example: `[0,1,0,3,12]` → `1 3 12 0 0`)
2. **Kadane's Algorithm:** Find the maximum sum of a contiguous subarray. (Example: `[-2,1,-3,4,-1,2,1,-5,4]` → `Max Sum = 6`)
3. **Missing Number:** Given `n-1` distinct integers from 1 to `n` in an array, find the missing number, using the sum formula rather than a frequency array. (Example: `[1,2,4,5]`, n=5 → `Missing = 3`)

---
*End of Module 7. Next: Module 8, 2D Arrays and Matrices.*
