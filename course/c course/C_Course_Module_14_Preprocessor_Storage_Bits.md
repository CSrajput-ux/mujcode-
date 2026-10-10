# C Programming Course: Zero to Advanced

## Module 14: Preprocessor, Storage Classes and Bit Manipulation
**Level:** Advanced | **Questions:** 10

**Topics covered:** `#define` macros, conditional compilation, `auto`/`static`/`extern`/`register`, `static` variables inside functions, command-line arguments, bit counting and manipulation.

**Before you start:**
- The preprocessor runs **before** compilation; it does simple text substitution, so macros do not know about types or scope.
- A `static` local variable keeps its value between function calls (initialized only once, the first time).
- Command-line arguments arrive through `int main(int argc, char *argv[])`: `argc` is the count (including the program name itself), and `argv[0]` is the program name.
- Bit positions are numbered from 0 (least significant / rightmost bit).

---

## Question 1: Macros — Constants and Function-Like Macros
**Difficulty:** Easy

**Problem Description:**
Define a constant macro `#define PI 3.14159` and a function-like macro `#define SQUARE(x) ((x) * (x))`. Read the radius of a circle, then use these macros to compute and print the circle's area (`PI * SQUARE(radius)`) with 2 decimal places.

**Input Format:** A single real number, the radius.

**Output Format:** `Area = <value>`

**Constraints:** 0 < radius ≤ 1000

**Example:**
```
Input:
5

Output:
Area = 78.54
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Area = 78.54` |
| 2 | `2` | `Area = 12.57` |
| 3 | `1` | `Area = 3.14` |

**Hint:** Always wrap macro parameters and the whole macro body in parentheses, `((x) * (x))`, or expressions like `SQUARE(a + b)` will expand incorrectly to `a + b * a + b` instead of `(a+b)*(a+b)`.

---

## Question 2: Conditional Compilation
**Difficulty:** Medium

**Problem Description:**
Write a program that defines (or does not define) a macro `DEBUG_MODE` near the top of the file. Using `#ifdef DEBUG_MODE` / `#else` / `#endif`, print an extra diagnostic line only when `DEBUG_MODE` is defined. Read two numbers, print their sum always, and print `Debug: computing sum` before it only in debug mode.

**Input Format:** One line with two integers `a b`.

**Output Format (DEBUG_MODE defined):**
```
Debug: computing sum
Sum = <value>
```
**Output Format (DEBUG_MODE not defined):**
```
Sum = <value>
```

**Constraints:** -10^6 ≤ a, b ≤ 10^6

**Example (with DEBUG_MODE defined):**
```
Input:
3 4

Output:
Debug: computing sum
Sum = 7
```

**Test Cases:**

| # | DEBUG_MODE | Input | Expected Output |
|---|------------|-------|-----------------|
| 1 | defined | `3 4` | `Debug: computing sum` <br> `Sum = 7` |
| 2 | not defined | `3 4` | `Sum = 7` |
| 3 | defined | `-5 5` | `Debug: computing sum` <br> `Sum = 0` |

**Hint:** `#define DEBUG_MODE` (with no value) before `main()` turns it on; commenting that line out or removing it turns it off. Submit two versions if your grading system needs to see both behaviors, or use a `#if 0 ... #endif` block to disable it.

---

## Question 3: Storage Classes Demo
**Difficulty:** Medium

**Problem Description:**
Declare one variable of each storage class: `auto`, `static`, `extern` (with a matching global definition elsewhere in the file), and `register`. Print all four values to show that they behave identically in terms of the value they hold, even though their storage/lifetime differs.

**Input Format:** Four integers, one for each variable's initial value.

**Output Format:**
```
auto: <value>
static: <value>
extern: <value>
register: <value>
```

**Constraints:** -1000 ≤ each value ≤ 1000

**Example:**
```
Input:
1 2 3 4

Output:
auto: 1
static: 2
extern: 3
register: 4
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `1 2 3 4` | `auto: 1` <br> `static: 2` <br> `extern: 3` <br> `register: 4` |
| 2 | `0 0 0 0` | `auto: 0` <br> `static: 0` <br> `extern: 0` <br> `register: 0` |
| 3 | `-5 10 -15 20` | `auto: -5` <br> `static: 10` <br> `extern: -15` <br> `register: 20` |

**Hint:** `auto` is the default for local variables (rarely written explicitly). Declare the extern variable's real definition at file scope, outside any function, and use `extern int e;` inside the function to refer to it. Modern compilers may ignore `register` as a hint, but the keyword still compiles.

---

## Question 4: Static Variable — Function Call Counter
**Difficulty:** Medium

**Problem Description:**
Write a function `void trackCalls()` containing a `static int count = 0;`. Each time the function is called, it should increment `count` and print `This function has been called <count> time(s)`. Read `n` and call the function `n` times.

**Input Format:** A single integer `n`.

**Output Format:** `n` lines, one per call.

**Constraints:** 1 ≤ n ≤ 100

**Example:**
```
Input:
3

Output:
This function has been called 1 time(s)
This function has been called 2 time(s)
This function has been called 3 time(s)
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3` | `This function has been called 1 time(s)` <br> `This function has been called 2 time(s)` <br> `This function has been called 3 time(s)` |
| 2 | `1` | `This function has been called 1 time(s)` |
| 3 | `5` | 5 lines, counts 1 through 5 |

**Hint:** If `count` were declared as a normal (non-static) local variable instead, it would reset to 0 on every call, and the output would incorrectly show `1` every time.

---

## Question 5: Sum of Command-Line Arguments
**Difficulty:** Medium

**Problem Description:**
Write a program that reads integers passed as command-line arguments (not from `scanf`) and prints their sum. If no numeric arguments are given (only the program name), print `No arguments provided`.

**Input Format:** Command-line arguments when running the program, e.g. `./a.out 10 20 30`.

**Output Format:** `Sum = <value>` or `No arguments provided`.

**Constraints:** 0 to 20 arguments, each -10^6 to 10^6.

**Example:**
```
Run as: ./a.out 10 20 30

Output:
Sum = 60
```

**Test Cases:**

| # | Command line | Expected Output |
|---|---------------|------------------|
| 1 | `./a.out 10 20 30` | `Sum = 60` |
| 2 | `./a.out` | `No arguments provided` |
| 3 | `./a.out -5 5` | `Sum = 0` |

**Hint:** `argc` includes the program name, so the number of actual arguments is `argc - 1`. Loop `for (i = 1; i < argc; i++) sum += atoi(argv[i]);`. If your platform runs code without letting you pass command-line arguments directly, check its documentation for how to supply them (this varies by IDE/judge).

---

## Question 6: Count Set Bits
**Difficulty:** Medium

**Problem Description:**
Read a non-negative integer and count how many bits are set to `1` in its binary representation.

**Input Format:** A single integer `n`.

**Output Format:** `Set bits = <count>`

**Constraints:** 0 ≤ n ≤ 2^31 - 1

**Example:**
```
Input:
13

Output:
Set bits = 3
```

*Working:* `13` in binary is `1101`, which has three `1` bits.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `13` | `Set bits = 3` |
| 2 | `0` | `Set bits = 0` |
| 3 | `255` | `Set bits = 8` |

**Hint:** Loop while `n > 0`: check `n & 1`, add it to the count, then `n = n >> 1`. A neat one-liner trick is `n = n & (n - 1);` which clears the lowest set bit each time — count how many times you can do this before `n` becomes 0.

---

## Question 7: Check If a Number Is a Power of 2
**Difficulty:** Medium

**Problem Description:**
Read a positive integer and check whether it is a power of 2 (1, 2, 4, 8, 16, ...), using a bitwise trick rather than a loop of repeated division.

**Input Format:** A single integer `n`.

**Output Format:** `Power of 2` or `Not a power of 2`

**Constraints:** 1 ≤ n ≤ 2^31 - 1

**Example:**
```
Input:
16

Output:
Power of 2
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `16` | `Power of 2` |
| 2 | `18` | `Not a power of 2` |
| 3 | `1` | `Power of 2` |

**Hint:** A power of 2 has exactly one bit set. The trick `n & (n - 1) == 0` clears the lowest set bit; if the result is 0, there was only one set bit to begin with. Note `1 & 0 = 0`, so `1` correctly counts as a power of 2 (`2^0`).

---

## Question 8: Set, Clear and Toggle a Bit
**Difficulty:** Medium

**Problem Description:**
Read an integer `n` and a bit position `pos` (0-indexed from the right). Print the value of `n` after setting that bit to 1, after clearing that bit to 0, and after toggling (flipping) that bit — computed independently from the original `n` each time, not cumulatively.

**Input Format:** One line: `n pos`.

**Output Format:**
```
After set = <value>
After clear = <value>
After toggle = <value>
```

**Constraints:** 0 ≤ n ≤ 2^31 - 1, 0 ≤ pos ≤ 30

**Example:**
```
Input:
10 0

Output:
After set = 11
After clear = 10
After toggle = 11
```

*Working:* `10` is `1010`. Bit 0 is currently 0. Setting it gives `1011` = 11. Clearing it (already 0) leaves `1010` = 10. Toggling flips it from 0 to 1, giving `1011` = 11.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `10 0` | `After set = 11` <br> `After clear = 10` <br> `After toggle = 11` |
| 2 | `10 1` | `After set = 10` <br> `After clear = 8` <br> `After toggle = 8` |
| 3 | `0 3` | `After set = 8` <br> `After clear = 0` <br> `After toggle = 8` |

**Hint:** Set: `n | (1 << pos)`. Clear: `n & ~(1 << pos)`. Toggle: `n ^ (1 << pos)`.

---

## Question 9: Print the Binary Representation of a Number
**Difficulty:** Medium

**Problem Description:**
Read a non-negative integer and print its binary representation using exactly 8 bits (pad with leading zeros if needed). If the number requires more than 8 bits, print its full binary representation without truncation instead.

**Input Format:** A single integer `n`.

**Output Format:** The binary string.

**Constraints:** 0 ≤ n ≤ 10^6

**Example:**
```
Input:
5

Output:
00000101
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `00000101` |
| 2 | `0` | `00000000` |
| 3 | `300` | `100101100` |

*Note:* Test 3 needs 9 bits (`300` in binary is `100101100`), so it is printed in full rather than padded/truncated to 8.

**Hint:** Determine the minimum number of bits needed first (find the highest set bit), then print `max(8, that many)` bits from the most significant down to bit 0, using `(n >> i) & 1` for each position `i`.

---

## Question 10: Swap Two Numbers Using Only Bitwise XOR
**Difficulty:** Medium

**Problem Description:**
Read two integers and swap them using only the XOR bitwise operator (no arithmetic, no temporary variable).

**Input Format:** One line with two integers `a b`.

**Output Format:**
```
Before swap: a = <a>, b = <b>
After swap: a = <b>, b = <a>
```

**Constraints:** -10^9 ≤ a, b ≤ 10^9

**Example:**
```
Input:
5 9

Output:
Before swap: a = 5, b = 9
After swap: a = 9, b = 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5 9` | `Before swap: a = 5, b = 9` <br> `After swap: a = 9, b = 5` |
| 2 | `-3 8` | `Before swap: a = -3, b = 8` <br> `After swap: a = 8, b = -3` |
| 3 | `7 7` | `Before swap: a = 7, b = 7` <br> `After swap: a = 7, b = 7` |

**Hint:** `a = a ^ b; b = a ^ b; a = a ^ b;`. **Warning:** this trick fails if `a` and `b` are the *same variable* (e.g., `arr[i] ^= arr[i];` when `i` happens to equal `j` in a generic swap function) because the variable XORs with itself and becomes 0. Test 3 (`a == b` but stored in two separate variables) still works correctly — the danger is only when both names refer to the same memory location.

---

## Module 14 Challenge Questions (Optional)

1. **Multi-Value Macro:** Write a macro `MAX3(a, b, c)` that expands to the maximum of three values using nested ternary operators, and test it with values that reveal a bug if parentheses are missing. (Example: `MAX3(1+2, 3, 4)` should correctly give `4`)
2. **Static Variable Across Multiple Functions:** Simulate a simple ID generator: a `static` counter inside a function `int getNextId()` that returns 1, 2, 3, ... on successive calls, used to assign unique IDs to several "objects" in a loop. (Example: creating 3 objects → IDs `1, 2, 3`)
3. **Bit Manipulation — Find the Only Non-Repeating Element:** Given an array where every element appears twice except one, find that one element using XOR of all elements (no extra memory). (Example: `[4,1,2,1,2]` → `4`)

---
*End of Module 14. Next: Module 15, Data Structures, Algorithms and Final Project.*
