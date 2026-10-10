# C Programming Course: Zero to Advanced

## Module 11: Dynamic Memory Allocation
**Level:** Upper-Intermediate | **Questions:** 10

**Topics covered:** `malloc`, `calloc`, `realloc`, `free`, dynamic 1D and 2D arrays, dynamic strings, memory leaks, resizable structures.

**Before you start:**
- `malloc(n * sizeof(type))` allocates `n` elements of uninitialized memory and returns `void*`; cast it, e.g. `int *arr = malloc(n * sizeof(int));`.
- `calloc(n, sizeof(type))` allocates the same amount but initializes all bytes to zero.
- `realloc(ptr, newSize)` resizes a previous allocation, possibly moving it; always assign its result to a **new** pointer first, in case it returns `NULL` on failure (otherwise you leak the original block).
- Every successful `malloc`/`calloc`/`realloc` must be matched with exactly one `free()` once the memory is no longer needed. Freeing twice, or using memory after freeing it, is undefined behaviour.
- Always check whether the allocation function returned `NULL` before using the pointer.

---

## Question 1: Dynamic Array Using malloc
**Difficulty:** Easy–Medium

**Problem Description:**
Read `n`, dynamically allocate an array of `n` integers using `malloc`, read `n` values into it, compute their sum, print the sum, and free the memory.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** `Sum = <value>`

**Constraints:** 1 ≤ n ≤ 100000

**Example:**
```
Input:
4
10 20 30 40

Output:
Sum = 100
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `4` / `10 20 30 40` | `Sum = 100` |
| 2 | `1` / `7` | `Sum = 7` |
| 3 | `100000` / (100000 values of `1`) | `Sum = 100000` |

**Hint:** `int *arr = malloc(n * sizeof(int));` — check `if (arr == NULL) { printf("Allocation failed\n"); return 1; }` before using it. Call `free(arr);` at the end.

---

## Question 2: malloc vs calloc — Initial Values
**Difficulty:** Easy–Medium

**Problem Description:**
Allocate two arrays of `n` integers: one with `malloc` and one with `calloc`. Without writing any values into either array, print all elements of both. This demonstrates that `calloc` zero-initializes memory while `malloc` leaves it uninitialized (containing "garbage" values).

**Input Format:** A single integer `n`.

**Output Format:**
```
Calloc array: <n zeros, space-separated>
Malloc array: <n unspecified values, space-separated>
```

**Constraints:** 1 ≤ n ≤ 20

**Example:**
```
Input:
5

Output:
Calloc array: 0 0 0 0 0
Malloc array: 32767 0 4200992 1 6422324
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Calloc array: 0 0 0 0 0` (always); malloc array: unspecified values (varies by run) |
| 2 | `1` | `Calloc array: 0` (always); malloc array: unspecified (varies) |
| 3 | `10` | `Calloc array: 0 0 0 0 0 0 0 0 0 0` (always); malloc array: unspecified (varies) |

*Note:* Only the calloc line has a guaranteed, checkable output. The malloc line is included to observe the behaviour on your own machine — its exact values are not something a grader can check and will differ every run.

**Hint:** `int *a = calloc(n, sizeof(int)); int *b = malloc(n * sizeof(int));`. Never rely on `malloc` giving zeros — always initialize explicitly if you need known starting values.

---

## Question 3: Resize an Array Using realloc
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into a dynamically allocated array of size `n` using `malloc`. Then read `m` more integers, use `realloc` to grow the array to size `n + m`, and append them. Print the full resulting array.

**Input Format:** Line 1: `n`. Line 2: `n` integers. Line 3: `m`. Line 4: `m` integers.

**Output Format:** The combined array, space-separated, of size `n + m`.

**Constraints:** 0 ≤ n, m ≤ 1000 (at least one of n, m is greater than 0)

**Example:**
```
Input:
3
1 2 3
2
4 5

Output:
1 2 3 4 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3` / `1 2 3` / `2` / `4 5` | `1 2 3 4 5` |
| 2 | `2` / `10 20` / `0` / (empty) | `10 20` |
| 3 | `0` / (empty) / `3` / `7 8 9` | `7 8 9` |

**Hint:** `int *temp = realloc(arr, (n + m) * sizeof(int)); if (temp == NULL) { /* handle failure, old arr still valid */ } arr = temp;`. Then write the new `m` values starting at index `n`.

---

## Question 4: Dynamic 2D Array
**Difficulty:** Medium

**Problem Description:**
Read `r` and `c`. Dynamically allocate a 2D array of size `r × c` (as an array of row pointers), read its values, print it back in grid form, and free all allocated memory correctly.

**Input Format:** Line 1: `r c`. Next `r` lines: `c` integers each.

**Output Format:** The matrix, `r` lines of `c` space-separated integers.

**Constraints:** 1 ≤ r, c ≤ 100

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

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `2 3` / `1 2 3` / `4 5 6` | `1 2 3` <br> `4 5 6` |
| 2 | `1 1` / `9` | `9` |
| 3 | `3 1` / `1` / `2` / `3` | `1` <br> `2` <br> `3` |

**Hint:** `int **mat = malloc(r * sizeof(int*)); for (i = 0; i < r; i++) mat[i] = malloc(c * sizeof(int));`. When freeing, free each row first, then free the array of row pointers: `for (i = 0; i < r; i++) free(mat[i]); free(mat);` — freeing in the opposite order leaks memory.

---

## Question 5: Dynamic String Input of Unknown Length
**Difficulty:** Medium

**Problem Description:**
Read a line of text of unknown length by growing a dynamically allocated buffer character by character (do not assume a maximum length in advance; grow using `realloc` when the buffer fills up). Print the string and its length.

**Input Format:** One line of text (letters, digits, spaces — no newline handling needed beyond stopping at end of line).

**Output Format:**
```
String: <text>
Length = <value>
```

**Constraints:** 1 ≤ length ≤ 100000

**Example:**
```
Input:
hello dynamic world

Output:
String: hello dynamic world
Length = 20
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `hello dynamic world` | `String: hello dynamic world` <br> `Length = 20` |
| 2 | `a` | `String: a` <br> `Length = 1` |
| 3 | (a line of 50 repeated `x` characters) | `String: xxxx...x` (50 x's) <br> `Length = 50` |

**Hint:** Start with a small capacity (e.g. 4), read characters with `getchar()` in a loop until `\n` or `EOF`, and whenever the buffer is full, double the capacity with `realloc`. Remember to add `'\0'` at the end and to `free()` the buffer when done.

---

## Question 6: Demonstrating and Fixing a Memory Leak
**Difficulty:** Medium

**Problem Description:**
Write a program with a function `void leaky()` that allocates memory with `malloc` for an array of 100 integers but never frees it, and call this function `n` times. Then write a corrected version, `void fixed()`, that allocates, uses, and properly frees the memory, and call it `n` times as well. Print a message after each version completes so the difference is visible in the code (the leak itself is not something the program's own output can detect).

**Input Format:** A single integer `n`.

**Output Format:**
```
Leaky version ran n times (memory not freed each time)
Fixed version ran n times (memory freed each time)
```
(Replace `n` with the actual value.)

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5

Output:
Leaky version ran 5 times (memory not freed each time)
Fixed version ran 5 times (memory freed each time)
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Leaky version ran 5 times (memory not freed each time)` <br> `Fixed version ran 5 times (memory freed each time)` |
| 2 | `1` | `Leaky version ran 1 times (memory not freed each time)` <br> `Fixed version ran 1 times (memory freed each time)` |
| 3 | `1000` | `Leaky version ran 1000 times (memory not freed each time)` <br> `Fixed version ran 1000 times (memory freed each time)` |

**Hint:** This question is really about the source code, not the printed output. Use a tool like `valgrind` (on Linux) if available to see the leak reported for the leaky version and confirm zero leaks for the fixed version.

---

## Question 7: Insert an Element at a Given Position (Dynamic Array)
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into a dynamically allocated array. Then read a position `pos` (0-indexed) and a value `val`. Grow the array by one using `realloc`, shift elements to make room, and insert `val` at index `pos`. Print the resulting array.

**Input Format:** Line 1: `n`. Line 2: `n` integers. Line 3: `pos val`.

**Output Format:** The array after insertion, size `n + 1`, space-separated.

**Constraints:** 0 ≤ n ≤ 1000, 0 ≤ pos ≤ n

**Example:**
```
Input:
5
1 2 3 4 5
2 99

Output:
1 2 99 3 4 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` / `2 99` | `1 2 99 3 4 5` |
| 2 | `3` / `1 2 3` / `0 100` | `100 1 2 3` |
| 3 | `3` / `1 2 3` / `3 100` | `1 2 3 100` |

**Hint:** After `realloc` to size `n+1`, shift elements from the end backward: `for (i = n; i > pos; i--) arr[i] = arr[i-1];`, then set `arr[pos] = val`. Shifting from the front instead would overwrite values before you copy them.

---

## Question 8: Delete an Element at a Given Position (Dynamic Array)
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into a dynamically allocated array. Then read a position `pos` (0-indexed) to delete. Shift elements to fill the gap, use `realloc` to shrink the array by one, and print the result. If `n` becomes 0, print `Array is empty`.

**Input Format:** Line 1: `n`. Line 2: `n` integers. Line 3: `pos`.

**Output Format:** The array after deletion, space-separated, or `Array is empty`.

**Constraints:** 1 ≤ n ≤ 1000, 0 ≤ pos < n

**Example:**
```
Input:
5
1 2 3 4 5
2

Output:
1 2 4 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` / `2` | `1 2 4 5` |
| 2 | `1` / `9` / `0` | `Array is empty` |
| 3 | `4` / `10 20 30 40` / `0` | `20 30 40` |

**Hint:** Shift elements forward from `pos` onward: `for (i = pos; i < n - 1; i++) arr[i] = arr[i+1];`, then `realloc` to size `n-1` (or `free` entirely if the new size is 0).

---

## Question 9: Jagged Array (Rows of Different Sizes)
**Difficulty:** Medium

**Problem Description:**
Read `r`, the number of rows. For each row `i`, read its own size `sizes[i]` followed by that many integers. Dynamically allocate a jagged 2D array (each row can have a different length) and print each row on its own line.

**Input Format:** Line 1: `r`. Then, for each row: a line with `sizes[i]` followed by `sizes[i]` integers.

**Output Format:** `r` lines, each showing that row's elements space-separated.

**Constraints:** 1 ≤ r ≤ 100, 0 ≤ sizes[i] ≤ 100

**Example:**
```
Input:
3
2 1 2
4 3 4 5 6
1 9

Output:
1 2
3 4 5 6
9
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3` / `2 1 2` / `4 3 4 5 6` / `1 9` | `1 2` <br> `3 4 5 6` <br> `9` |
| 2 | `2` / `0` / `3 1 2 3` | (empty line) <br> `1 2 3` |
| 3 | `1` / `5 1 2 3 4 5` | `1 2 3 4 5` |

**Hint:** Use `int **jagged = malloc(r * sizeof(int*));` and, for each row, `jagged[i] = malloc(sizes[i] * sizeof(int));` with the actual `sizes[i]` for that row, not a fixed value.

---

## Question 10: Implement a Simple Auto-Resizing "Vector"
**Difficulty:** Medium–Hard

**Problem Description:**
Implement a minimal dynamic array structure similar to C++'s `vector`, using a `struct` with a data pointer, a `size` (elements used) and a `capacity` (elements allocated). Write a `push_back(Vector *v, int value)` function that appends a value, doubling the capacity with `realloc` whenever the array is full. Start with capacity 2. Read `n` values, push them all one by one, then print the final array, its size, and its capacity.

**Input Format:** Line 1: `n`. Line 2: `n` integers.

**Output Format:**
```
Elements: <space-separated values>
Size = <n>
Capacity = <final capacity>
```

**Constraints:** 0 ≤ n ≤ 1000

**Example:**
```
Input:
5
1 2 3 4 5

Output:
Elements: 1 2 3 4 5
Size = 5
Capacity = 8
```

*Working:* Capacity starts at 2. Pushing the 3rd element requires growing to 4. Pushing the 5th element requires growing to 8. So after 5 pushes, capacity is 8.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` | `Elements: 1 2 3 4 5` <br> `Size = 5` <br> `Capacity = 8` |
| 2 | `0` / (empty) | `Elements: ` <br> `Size = 0` <br> `Capacity = 2` |
| 3 | `2` / `10 20` | `Elements: 10 20` <br> `Size = 2` <br> `Capacity = 2` |

**Hint:** `struct Vector { int *data; int size; int capacity; };`. In `push_back`, check `if (v->size == v->capacity) { v->capacity *= 2; v->data = realloc(v->data, v->capacity * sizeof(int)); }` before storing the new value and incrementing `size`.

---

## Module 11 Challenge Questions (Optional)

1. **Dynamic Matrix Transpose:** Allocate a matrix dynamically, compute its transpose into another dynamically allocated matrix, and free both properly. (Example: `2×3` → `3×2` transposed matrix)
2. **Merge Two Dynamic Arrays:** Allocate two arrays dynamically, merge them into a newly allocated third array (not necessarily sorted), and free the first two. (Example: `[1,2]` and `[3,4]` → `[1,2,3,4]`)
3. **Dynamic String Array (Array of Names):** Read `n` names of varying lengths, storing each in its own dynamically sized buffer (an array of `char*`), then print them sorted alphabetically. (Example: `["Zoya","Amit","Raj"]` → `Amit Raj Zoya`)

---
*End of Module 11. Next: Module 12, Structures, Unions and Enums.*
