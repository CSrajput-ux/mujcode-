# C Programming Course: Zero to Advanced

## Module 12: Structures, Unions and Enums
**Level:** Upper-Intermediate | **Questions:** 10

**Topics covered:** `struct` declaration and usage, arrays of structures, nested structures, passing structures to functions, `union`, `enum`, `typedef`.

**Before you start:**
- Declare a structure with `struct Name { ... };` and create variables with `struct Name var;`, or use `typedef` to drop the `struct` keyword afterward.
- Access members with `.` for a normal variable and `->` for a pointer to a structure.
- A `union` shares the same memory among all its members — writing to one member overwrites the others, and the union's size equals its largest member's size, not the sum of all members.
- `enum` creates named integer constants starting from 0 by default (unless you assign specific values).

---

## Question 1: Basic Structure — Student Record
**Difficulty:** Easy

**Problem Description:**
Define a `struct Student` with fields `name` (string), `roll` (int) and `marks` (float). Read one student's details and print them in a formatted way.

**Input Format:** One line: `name roll marks`.

**Output Format:**
```
Name: <name>
Roll: <roll>
Marks: <marks with 2 decimals>
```

**Constraints:** name has no spaces, 1 ≤ roll ≤ 10000, 0 ≤ marks ≤ 100

**Example:**
```
Input:
Aarav 101 87.5

Output:
Name: Aarav
Roll: 101
Marks: 87.50
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Aarav 101 87.5` | `Name: Aarav` <br> `Roll: 101` <br> `Marks: 87.50` |
| 2 | `Priya 205 99` | `Name: Priya` <br> `Roll: 205` <br> `Marks: 99.00` |
| 3 | `Zoya 1 0` | `Name: Zoya` <br> `Roll: 1` <br> `Marks: 0.00` |

**Hint:** `struct Student { char name[50]; int roll; float marks; };`

---

## Question 2: Array of Structures — Find the Topper
**Difficulty:** Easy–Medium

**Problem Description:**
Read `n` students, each with `name` and `marks`, using an array of `struct Student`. Find and print the name and marks of the student with the highest marks. If there is a tie, print the **first** one that appears.

**Input Format:** Line 1: `n`. Next `n` lines: `name marks`.

**Output Format:** `Topper: <name> with <marks> marks`

**Constraints:** 1 ≤ n ≤ 1000, 0 ≤ marks ≤ 100

**Example:**
```
Input:
3
Aarav 78.5
Priya 92.0
Rohit 92.0

Output:
Topper: Priya with 92.00 marks
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3` / `Aarav 78.5` / `Priya 92.0` / `Rohit 92.0` | `Topper: Priya with 92.00 marks` |
| 2 | `1` / `Solo 50` | `Topper: Solo with 50.00 marks` |
| 3 | `2` / `A 10` / `B 99.99` | `Topper: B with 99.99 marks` |

**Hint:** Track the index of the best student found so far, and use a strict `>` comparison (not `>=`) when updating, so the first of any tie is kept.

---

## Question 3: Nested Structure — Employee with Address
**Difficulty:** Medium

**Problem Description:**
Define a `struct Address` with `city` and `pincode`. Define a `struct Employee` with `name`, `salary`, and an `Address` field nested inside it. Read one employee's full details and print them.

**Input Format:** One line: `name salary city pincode`.

**Output Format:**
```
Employee: <name>
Salary: <salary with 2 decimals>
City: <city>
Pincode: <pincode>
```

**Constraints:** name and city have no spaces, 0 ≤ salary ≤ 10^7, pincode is a 6-digit number.

**Example:**
```
Input:
Kabir 55000 Jaipur 302001

Output:
Employee: Kabir
Salary: 55000.00
City: Jaipur
Pincode: 302001
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Kabir 55000 Jaipur 302001` | (as above) |
| 2 | `Meera 82500.50 Delhi 110001` | `Employee: Meera` <br> `Salary: 82500.50` <br> `City: Delhi` <br> `Pincode: 110001` |
| 3 | `Sam 0 Pune 411001` | `Employee: Sam` <br> `Salary: 0.00` <br> `City: Pune` <br> `Pincode: 411001` |

**Hint:** `struct Employee { char name[50]; float salary; struct Address addr; };` — access the nested fields as `emp.addr.city`.

---

## Question 4: Pass a Structure to a Function (By Value and By Pointer)
**Difficulty:** Medium

**Problem Description:**
Define `struct Point { int x, y; }`. Write a function `void tryModifyByValue(struct Point p)` that adds 10 to both coordinates of its local copy, and a function `void modifyByPointer(struct Point *p)` that adds 10 to both coordinates through a pointer. Read a point, call both functions in order, and print the point's coordinates after each call to show that only the pointer version changes the original.

**Input Format:** One line: `x y`.

**Output Format:**
```
Original: (x, y)
After by-value call: (x, y)
After by-pointer call: (x+10, y+10)
```

**Constraints:** -10^4 ≤ x, y ≤ 10^4

**Example:**
```
Input:
3 4

Output:
Original: (3, 4)
After by-value call: (3, 4)
After by-pointer call: (13, 14)
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `3 4` | (as above) |
| 2 | `0 0` | `Original: (0, 0)` <br> `After by-value call: (0, 0)` <br> `After by-pointer call: (10, 10)` |
| 3 | `-5 7` | `Original: (-5, 7)` <br> `After by-value call: (-5, 7)` <br> `After by-pointer call: (5, 17)` |

**Hint:** This mirrors the call-by-value versus call-by-reference lesson from Module 6 and Module 10, now applied to whole structures instead of single variables.

---

## Question 5: Compare Two Dates (Structure)
**Difficulty:** Medium

**Problem Description:**
Define `struct Date { int day, month, year; }`. Read two dates and determine which one is earlier, later, or whether they are the same date.

**Input Format:** Two lines, each `day month year`.

**Output Format:** `Date 1 is earlier`, `Date 2 is earlier`, or `Same date`.

**Constraints:** valid calendar dates, 1 ≤ year ≤ 9999

**Example:**
```
Input:
15 8 1998
1 1 2000

Output:
Date 1 is earlier
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `15 8 1998` / `1 1 2000` | `Date 1 is earlier` |
| 2 | `20 5 2020` / `20 5 2020` | `Same date` |
| 3 | `31 12 2025` / `1 1 2025` | `Date 2 is earlier` |

**Hint:** Compare `year` first; if equal, compare `month`; if still equal, compare `day`. This is the standard multi-field comparison pattern.

---

## Question 6: Add and Multiply Complex Numbers (Structure)
**Difficulty:** Medium

**Problem Description:**
Define `struct Complex { float real, imag; }`. Write functions `addComplex` and `multiplyComplex` that each take two `struct Complex` values and return a new `struct Complex`. Read two complex numbers and print their sum and product.

**Formulas:** Sum = `(a.real + b.real) + (a.imag + b.imag)i`. Product = `(a.real*b.real - a.imag*b.imag) + (a.real*b.imag + a.imag*b.real)i`.

**Input Format:** Two lines, each `real imag`.

**Output Format:**
```
Sum = <real> + <imag>i
Product = <real> + <imag>i
```
All values with 2 decimal places. If the imaginary part is negative, it should still print with its own sign (e.g., `3.00 + -2.00i` is acceptable), or you may format negatives as `3.00 - 2.00i` — pick one style and be consistent.

**Constraints:** -1000 ≤ real, imag ≤ 1000

**Example:**
```
Input:
2 3
1 4

Output:
Sum = 3.00 + 7.00i
Product = -10.00 + 11.00i
```

*Working for product:* `2*1 - 3*4 = 2 - 12 = -10`, and `2*4 + 3*1 = 8 + 3 = 11`.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `2 3` / `1 4` | `Sum = 3.00 + 7.00i` <br> `Product = -10.00 + 11.00i` |
| 2 | `1 0` / `0 1` | `Sum = 1.00 + 1.00i` <br> `Product = 0.00 + 1.00i` |
| 3 | `0 0` / `5 5` | `Sum = 5.00 + 5.00i` <br> `Product = 0.00 + 0.00i` |

**Hint:** Build and return a `struct Complex` literal-style: `struct Complex result; result.real = ...; result.imag = ...; return result;`

---

## Question 7: Union vs Structure — Memory Size Comparison
**Difficulty:** Medium

**Problem Description:**
Define a `struct Data` and a `union Data` (use different type names, e.g. `struct SData` and `union UData`), each containing an `int`, a `float` and a `char`, in the same order. Print the size of each using `sizeof`, and explain (in the program's output) the relationship.

**Input Format:** No input.

**Output Format:**
```
Size of struct = <value>
Size of union = <value>
```

**Constraints:** None (output depends on the compiler/system, see note).

**Example (typical 64-bit system):**
```
Output:
Size of struct = 12
Size of union = 4
```

**Test Cases:**

| # | Environment | Expected Output |
|---|-------------|-----------------|
| 1 | 64-bit GCC on Linux | `Size of struct = 12`, `Size of union = 4` (with `int`, `float`, `char` in that order and typical padding) |
| 2 | Any system | struct size ≥ union size, always, since the union only needs room for its largest member |

*Note:* The struct's exact size can vary due to padding/alignment rules, but it will always be at least as large as the union's size, which equals the size of its largest member (`4` bytes for either `int` or `float` on most systems).

**Hint:** `printf("%zu", sizeof(struct SData));` — this question is meant to be run and observed on your own machine, since exact byte counts depend on the compiler.

---

## Question 8: Enum for Days and Weekend Check
**Difficulty:** Easy–Medium

**Problem Description:**
Define `enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }` (so `MONDAY = 0` and `SUNDAY = 6`). Read an integer from 0–6, treat it as an `enum Day` value, print its name, and print whether it is a weekend (Saturday or Sunday) or a weekday.

**Input Format:** A single integer `d` (0–6).

**Output Format:**
```
Day: <name>
Type: Weekend / Weekday
```

**Constraints:** 0 ≤ d ≤ 6

**Example:**
```
Input:
5

Output:
Day: SATURDAY
Type: Weekend
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` | `Day: SATURDAY` <br> `Type: Weekend` |
| 2 | `0` | `Day: MONDAY` <br> `Type: Weekday` |
| 3 | `6` | `Day: SUNDAY` <br> `Type: Weekend` |

**Hint:** You can use an array of strings indexed by the enum value to print its name, since C does not print enum names automatically: `char *names[] = {"MONDAY", "TUESDAY", ...};`

---

## Question 9: typedef with Structures — Library Book Management
**Difficulty:** Medium

**Problem Description:**
Use `typedef struct { char title[100]; int bookId; int isIssued; } Book;` so that `Book` can be used directly without writing `struct`. Support these commands, read one per line until `EXIT`:
- `ADD title bookId` — adds a book (default not issued)
- `ISSUE bookId` — marks a book issued if it exists and is not already issued; otherwise print `Cannot issue`
- `DISPLAY` — print all books as `title (ID: bookId) - Issued/Available`
- `EXIT` — stop the program

**Input Format:** A sequence of commands, one per line, ending with `EXIT`. At most 100 books.

**Output Format:** Output produced by `ISSUE` and `DISPLAY` commands, in order.

**Constraints:** bookId values are unique positive integers.

**Example:**
```
Input:
ADD CProgramming 101
ADD DataStructures 102
ISSUE 101
DISPLAY
EXIT

Output:
CProgramming (ID: 101) - Issued
DataStructures (ID: 102) - Available
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
ADD Physics 201
ISSUE 999
DISPLAY
EXIT
Output:
Cannot issue
Physics (ID: 201) - Available
```
Test 3:
```
Input:
ADD Math 1
ISSUE 1
ISSUE 1
DISPLAY
EXIT
Output:
Cannot issue
Math (ID: 1) - Issued
```

**Hint:** Store books in a `Book library[100];` array with a counter `count`. For `ISSUE`, search linearly by `bookId`; if found and `isIssued == 0`, set it to 1, else print `Cannot issue`.

---

## Question 10: Enum-Based Traffic Light Simulation
**Difficulty:** Medium

**Problem Description:**
Define `enum Light { RED, YELLOW, GREEN }`. Read a starting light and a number of steps `n`. The sequence always cycles `RED → GREEN → YELLOW → RED → ...`. Print the name of the light after each of the `n` steps (not including the starting light itself).

**Input Format:** Line 1: starting light as a string (`RED`, `YELLOW` or `GREEN`). Line 2: `n`.

**Output Format:** `n` lines, each the light name after that step.

**Constraints:** 1 ≤ n ≤ 100

**Example:**
```
Input:
RED
4

Output:
GREEN
YELLOW
RED
GREEN
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `RED` / `4` | `GREEN` <br> `YELLOW` <br> `RED` <br> `GREEN` |
| 2 | `GREEN` / `2` | `YELLOW` <br> `RED` |
| 3 | `YELLOW` / `1` | `RED` |

**Hint:** Convert the input string to the matching enum value first (compare with `strcmp` against `"RED"`, `"YELLOW"`, `"GREEN"`). Then use a `switch` or lookup table for the fixed cycle `RED → GREEN → YELLOW → RED`, repeating it `n` times.

---

## Module 12 Challenge Questions (Optional)

1. **Structure Array Sorting:** Sort an array of `struct Student` by marks in descending order (using any sort method) and print the sorted list. (Example: marks `[70,90,60]` → sorted names in order of `90,70,60`)
2. **Union for Type Punning Demo:** Store an `int` value into a union that also has a 4-byte `char[4]` array member, and print the individual bytes to observe the system's byte order (endianness). (Example: `int = 1` → shows which byte is `1` and which are `0`)
3. **Enum-Based State Machine:** Model a simple order status (`PLACED, SHIPPED, DELIVERED, CANCELLED`) with an enum, and write a function that prints the valid next states from any given state. (Example: `PLACED` → `Can go to: SHIPPED, CANCELLED`)

---
*End of Module 12. Next: Module 13, File Handling.*
