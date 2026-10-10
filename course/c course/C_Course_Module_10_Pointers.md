# C Programming Course: Zero to Advanced

## Module 10: Pointers
**Level:** Upper-Intermediate | **Questions:** 10

**Topics covered:** pointer declaration, address-of and dereference operators, call by reference, pointer arithmetic, pointer-to-pointer, pointers with arrays and strings, function pointers.

**Before you start:**
- `&x` gives the address of `x`. `*p` gives the value stored at the address held by `p`.
- `int *p = &x;` declares `p` as a pointer to an `int`, initialized to point at `x`.
- An array name, when used in most expressions, decays into a pointer to its first element: `arr` behaves like `&arr[0]`.
- Pointer arithmetic is scaled by the size of the pointed-to type: `p + 1` moves forward by `sizeof(*p)` bytes, not by 1 byte.
- Print an address with `%p`, and cast it to `(void*)` first: `printf("%p", (void*)p);`.

---

## Question 1: Basic Pointer Declaration
**Difficulty:** Easy

**Problem Description:**
Read an integer into a variable `x`. Declare a pointer `p` that points to `x`. Print the value of `x`, the address of `x`, the value stored in `p` (which should be the same address), and the value obtained by dereferencing `p`.

**Input Format:** A single integer `x`.

**Output Format:**
```
Value of x = <x>
Address of x = <address>
Value in pointer p = <same address>
Value pointed to by p = <x>
```

**Constraints:** -10^6 ≤ x ≤ 10^6

**Example:**
```
Input:
25

Output:
Value of x = 25
Address of x = 0x7ffd3a2b4a9c
Value in pointer p = 0x7ffd3a2b4a9c
Value pointed to by p = 25
```

**Test Cases:**

| # | Input | Expected Output (pattern) |
|---|-------|-----------------|
| 1 | `25` | `Value of x = 25`, address lines match each other, `Value pointed to by p = 25` |
| 2 | `-10` | `Value of x = -10`, ..., `Value pointed to by p = -10` |
| 3 | `0` | `Value of x = 0`, ..., `Value pointed to by p = 0` |

*Note:* The actual address is different every time you run the program — that is expected. What matters is that "Address of x" and "Value in pointer p" are always identical, and "Value pointed to by p" always equals "Value of x".

**Hint:** `int x; int *p = &x; printf("%p", (void*)&x);`

---

## Question 2: Swap Using Call by Reference
**Difficulty:** Easy–Medium

**Problem Description:**
Write a function `void swap(int *a, int *b)` that swaps the values at the addresses passed to it, using pointers. Call it from `main()` on two variables and show that, unlike Module 6 Question 3, the variables **do** change this time.

**Input Format:** One line with two integers `x y`.

**Output Format:**
```
Before swap: x = <x>, y = <y>
After swap: x = <y>, y = <x>
```

**Constraints:** -10^6 ≤ x, y ≤ 10^6

**Example:**
```
Input:
5 10

Output:
Before swap: x = 5, y = 10
After swap: x = 10, y = 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 10` | `Before swap: x = 5, y = 10` <br> `After swap: x = 10, y = 5` |
| 2 | `-1 1` | `Before swap: x = -1, y = 1` <br> `After swap: x = 1, y = -1` |
| 3 | `7 7` | `Before swap: x = 7, y = 7` <br> `After swap: x = 7, y = 7` |

**Hint:** Call it as `swap(&x, &y);`. Inside the function: `int temp = *a; *a = *b; *b = temp;`

---

## Question 3: Traverse an Array Using a Pointer
**Difficulty:** Easy–Medium

**Problem Description:**
Read `n` integers into an array. Using a pointer (not array indexing with `[]`), print all the elements and then print their sum.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:**
```
Elements: <space-separated values>
Sum = <value>
```

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
1 2 3 4 5

Output:
Elements: 1 2 3 4 5
Sum = 15
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `1 2 3 4 5` | `Elements: 1 2 3 4 5` <br> `Sum = 15` |
| 2 | `1` / `9` | `Elements: 9` <br> `Sum = 9` |
| 3 | `3` / `-1 -2 -3` | `Elements: -1 -2 -3` <br> `Sum = -6` |

**Hint:** `int *p = arr;` then loop: `for (i = 0; i < n; i++) { printf("%d ", *(p + i)); sum += *(p + i); }`. You may also try `*p++` in a `while` loop as a bonus.

---

## Question 4: Pointer Arithmetic Demo
**Difficulty:** Medium

**Problem Description:**
Declare an integer array of 5 elements and a pointer to its first element. Print the address stored in the pointer, then print the addresses after adding 1, 2 and 3 to the pointer. Also print the difference (in elements, not bytes) between the pointer after adding 3 and the original pointer.

**Input Format:** 5 integers (values are not important for the addresses, but read them into the array).

**Output Format:**
```
p = <address>
p+1 = <address>
p+2 = <address>
p+3 = <address>
(p+3) - p = <value>
```

**Constraints:** Any 5 integers.

**Example (addresses will differ on your machine):**
```
Input:
1 2 3 4 5

Output:
p = 0x7ffd1000
p+1 = 0x7ffd1004
p+2 = 0x7ffd1008
p+3 = 0x7ffd100c
(p+3) - p = 3
```

**Test Cases:**

| # | Input | Expected Pattern |
|---|-------|-----------------|
| 1 | `1 2 3 4 5` | consecutive addresses differ by `sizeof(int)` (commonly 4); last line is `3` |
| 2 | `10 20 30 40 50` | same pattern; last line is `3` |
| 3 | `0 0 0 0 0` | same pattern; last line is `3` |

*Note:* The actual addresses depend on your system, but the difference `(p+3) - p` is always `3`, because pointer subtraction gives the number of elements apart, not bytes.

**Hint:** `int *p = arr; printf("%p", (void*)(p + 1));`. This teaches that pointer arithmetic is automatically scaled by the type size.

---

## Question 5: Pointer to Pointer
**Difficulty:** Medium

**Problem Description:**
Read an integer `x`. Declare a pointer `p` pointing to `x`, and a pointer-to-pointer `pp` pointing to `p`. Print the value of `x` accessed three ways: directly, through `*p`, and through `**pp`. Then change the value of `x` to double its value using only `pp` (i.e., `**pp = **pp * 2;`) and print the new value of `x`.

**Input Format:** A single integer `x`.

**Output Format:**
```
Direct: <x>
Via *p: <x>
Via **pp: <x>
After doubling via **pp, x = <2x>
```

**Constraints:** -10^6 ≤ x ≤ 10^6

**Example:**
```
Input:
7

Output:
Direct: 7
Via *p: 7
Via **pp: 7
After doubling via **pp, x = 14
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `7` | `Direct: 7` / `Via *p: 7` / `Via **pp: 7` / `After doubling via **pp, x = 14` |
| 2 | `-5` | `Direct: -5` / `Via *p: -5` / `Via **pp: -5` / `After doubling via **pp, x = -10` |
| 3 | `0` | `Direct: 0` / `Via *p: 0` / `Via **pp: 0` / `After doubling via **pp, x = 0` |

**Hint:** `int x; int *p = &x; int **pp = &p;`. Changing `**pp` changes `x` itself, since `pp` → `p` → `x` is a chain of addresses.

---

## Question 6: Sum of Array Elements Using a Pointer-Based Function
**Difficulty:** Medium

**Problem Description:**
Write a function `int sumArray(int *arr, int n)` that receives an array through a pointer parameter and its size, and returns the sum of its elements. Call it from `main()`.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:** `Sum = <value>`

**Constraints:** 1 ≤ n ≤ 1000

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
| 2 | `1` / `5` | `Sum = 5` |
| 3 | `3` / `-10 5 5` | `Sum = 0` |

**Hint:** `int sumArray(int *arr, int n) { int s = 0; for (int i = 0; i < n; i++) s += arr[i]; return s; }`. Note that `int *arr` and `int arr[]` mean the same thing as a function parameter.

---

## Question 7: String Length Using a Pointer
**Difficulty:** Medium

**Problem Description:**
Write a function `int myStrLen(char *s)` that returns the length of a null-terminated string using pointer movement (no indexing with `[]` and no `strlen()`).

**Input Format:** A single line containing one word.

**Output Format:** `Length = <value>`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
pointer

Output:
Length = 7
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `pointer` | `Length = 7` |
| 2 | `a` | `Length = 1` |
| 3 | `programming` | `Length = 11` |

**Hint:** `int count = 0; while (*s != '\0') { count++; s++; } return count;`

---

## Question 8: Reverse a String Using Pointers
**Difficulty:** Medium

**Problem Description:**
Read a string and reverse it in place using two pointers: one starting at the first character and one at the last character (before the null terminator), swapping and moving inward.

**Input Format:** A single line containing one word.

**Output Format:** The reversed string.

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
pointer

Output:
retniop
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `pointer` | `retniop` |
| 2 | `a` | `a` |
| 3 | `level` | `level` |

**Hint:** `char *start = s; char *end = s + strlen(s) - 1;` (computing length via a loop, or Question 7's function), then swap `*start` and `*end`, incrementing `start` and decrementing `end` until they meet or cross.

---

## Question 9: Return Multiple Values From a Function Using Pointers
**Difficulty:** Medium

**Problem Description:**
Write a function `void minMax(int *arr, int n, int *min, int *max)` that finds both the minimum and maximum of an array in a single pass, and stores the results at the addresses given by the `min` and `max` pointers. Call it and print both values in `main()`.

**Input Format:** First line: `n`. Second line: `n` integers.

**Output Format:**
```
Minimum = <value>
Maximum = <value>
```

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
4 2 9 1 7

Output:
Minimum = 1
Maximum = 9
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `4 2 9 1 7` | `Minimum = 1` <br> `Maximum = 9` |
| 2 | `1` / `42` | `Minimum = 42` <br> `Maximum = 42` |
| 3 | `4` / `-5 -1 -9 -3` | `Minimum = -9` <br> `Maximum = -1` |

**Hint:** In `main()`, call `minMax(arr, n, &minVal, &maxVal);`. Since a function can only `return` one value directly, this pattern (writing results through pointer parameters) is how C functions produce multiple outputs.

---

## Question 10: Simple Calculator Using Function Pointers
**Difficulty:** Medium–Hard

**Problem Description:**
Write four functions `add`, `sub`, `mul`, `divi`, each taking two `int` parameters and returning an `int` (for division, return the integer quotient; assume the divisor is never 0). Declare an array of function pointers, one for each operation, and use an index (0 = add, 1 = sub, 2 = mul, 3 = divi) read from input to call the correct one through the function pointer array — do not use `if` or `switch` to choose the function.

**Input Format:** One line: `a b op_index`.

**Output Format:** `Result = <value>`

**Constraints:** -10^4 ≤ a, b ≤ 10^4, 0 ≤ op_index ≤ 3, b ≠ 0 when op_index = 3.

**Example:**
```
Input:
10 5 0

Output:
Result = 15
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 5 0` | `Result = 15` |
| 2 | `10 5 2` | `Result = 50` |
| 3 | `20 4 3` | `Result = 5` |

**Hint:** `int (*ops[4])(int, int) = {add, sub, mul, divi};` then call `ops[op_index](a, b);`. This is the same technique used internally by menu-driven programs and simple state machines.

---

## Module 10 Challenge Questions (Optional)

1. **Count Vowels Using a Pointer:** Write a function that receives a string via a pointer and counts vowels by advancing the pointer, without indexing. (Example: `"hello"` → `Vowels = 2`)
2. **Array of Pointers to Strings:** Declare an array of `char *` holding several names, print them all, then print only the one with the maximum length. (Example: `{"Amit","Priyanka","Raj"}` → `Longest = Priyanka`)
3. **Selection Sort Using Pointers:** Implement selection sort where the swap step is done through a pointer-based swap function. (Example: `[5,2,4,1]` → `1 2 4 5`)

---
*End of Module 10. Next: Module 11, Dynamic Memory Allocation.*
