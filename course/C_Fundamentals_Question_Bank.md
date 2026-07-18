# C Programming Fundamentals: Complete Question Bank

## MODULE 1: Introduction, Variables & Data Types

---

### 1️⃣ Question ID: C_MOD1_01
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** The Classic Greeting  
**5️⃣ Problem Description:** Write a C program that prints "Hello, C Programming!" to the console. This is the first step in your journey to becoming a C expert. Ensure you use the standard header for input and output.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** A single line containing the string "Hello, C Programming!".  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `Hello, C Programming!`  
**1️⃣1️⃣ Explanation:** The program uses `printf` from the `stdio.h` library to output a fixed string.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: (None) | Output: `Hello, C Programming!`
- **TC 2:** Input: (None) | Output: `Hello, C Programming!`
- **TC 3:** Input: (None) | Output: `Hello, C Programming!`
- **TC 4:** Input: (None) | Output: `Hello, C Programming!`
- **TC 5:** Input: (None) | Output: `Hello, C Programming!`  
**1️⃣3️⃣ Tags:** Basic I/O, Printf  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_02
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Echo the Integer  
**5️⃣ Problem Description:** Write a program that takes an integer as input and prints it back to the console with the prefix "The number is: ".  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single line: "The number is: [N]".  
**8️⃣ Constraints:** $-10^5 \leq N \leq 10^5$  
**9️⃣ Sample Input:** `42`  
**🔟 Sample Output:** `The number is: 42`  
**1️⃣1️⃣ Explanation:** The program reads an integer using `scanf` and displays it using `printf`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `The number is: 0`
- **TC 2:** Input: `-5` | Output: `The number is: -5`
- **TC 3:** Input: `100` | Output: `The number is: 100`
- **TC 4:** Input: `99999` | Output: `The number is: 99999`
- **TC 5:** Input: `-12345` | Output: `The number is: -12345`  
**1️⃣3️⃣ Tags:** Basic I/O, Scanf, Variables  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_03
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Floating Point Precision  
**5️⃣ Problem Description:** Input a floating-point number (decimal) and print it rounded to exactly 2 decimal places.  
**6️⃣ Input Format:** A single float value $X$.  
**7️⃣ Output Format:** The value $X$ rounded to 2 decimal places.  
**8️⃣ Constraints:** $0.0 \leq X \leq 10^6$  
**9️⃣ Sample Input:** `3.14159`  
**🔟 Sample Output:** `3.14`  
**1️⃣1️⃣ Explanation:** Use the `%.2f` format specifier in `printf` to control the precision of the output.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10.5` | Output: `10.50`
- **TC 2:** Input: `0.001` | Output: `0.00`
- **TC 3:** Input: `99.999` | Output: `100.00`
- **TC 4:** Input: `1.2345` | Output: `1.23`
- **TC 5:** Input: `500.0` | Output: `500.00`  
**1️⃣3️⃣ Tags:** Float, Precision, Basic I/O  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_04
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** ASCII Value Finder  
**5️⃣ Problem Description:** Every character in C has an associated integer value (ASCII). Write a program that takes a single character as input and prints its ASCII value.  
**6️⃣ Input Format:** A single character $C$.  
**7️⃣ Output Format:** An integer representing the ASCII value of $C$.  
**8️⃣ Constraints:** The input will be a valid printable ASCII character.  
**9️⃣ Sample Input:** `A`  
**🔟 Sample Output:** `65`  
**1️⃣1️⃣ Explanation:** In C, characters are treated as small integers. Printing a `char` with the `%d` format specifier reveals its ASCII value.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `a` | Output: `97`
- **TC 2:** Input: `0` | Output: `48`
- **TC 3:** Input: ` ` (space) | Output: `32`
- **TC 4:** Input: `$` | Output: `36`
- **TC 5:** Input: `Z` | Output: `90`  
**1️⃣3️⃣ Tags:** Character, ASCII, Data Types  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_05
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** The Size Explorer  
**5️⃣ Problem Description:** Different data types occupy different amounts of memory. Write a program that prints the size (in bytes) of an `int`, `float`, `double`, and `char` on the current system, each on a new line.  
**Note:** Use the `sizeof` operator.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:**
Size of int: [bytes]
Size of float: [bytes]
Size of double: [bytes]
Size of char: [bytes]  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** (Architecture dependent, typically: 4, 4, 8, 1)  
**1️⃣1️⃣ Explanation:** `sizeof` returns the number of bytes consumed by a type or variable.  
**1️⃣2️⃣ Test Cases:** (Assuming standard 32/64 bit results)
- **TC 1:** Output contains `Size of int: 4`
- **TC 2:** Output contains `Size of float: 4`
- **TC 3:** Output contains `Size of double: 8`
- **TC 4:** Output contains `Size of char: 1`
- **TC 5:** All lines printed in order.  
**1️⃣3️⃣ Tags:** Memory, Data Types, Sizeof  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_06
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Area of a Square  
**5️⃣ Problem Description:** Given the length of the side of a square as an integer, calculate and print its area.  
**6️⃣ Input Format:** A single integer $S$ representing the side.  
**7️⃣ Output Format:** A single integer representing the area ($S \times S$).  
**8️⃣ Constraints:** $1 \leq S \leq 1000$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `25`  
**1️⃣1️⃣ Explanation:** Area = Side * Side.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `1`
- **TC 2:** Input: `10` | Output: `100`
- **TC 3:** Input: `50` | Output: `2500`
- **TC 4:** Input: `3` | Output: `9`
- **TC 5:** Input: `1000` | Output: `1000000`  
**1️⃣3️⃣ Tags:** Math, Variables  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_07
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Swap Without Headache  
**5️⃣ Problem Description:** Input two integers $A$ and $B$. Swap their values using a third (temporary) variable and print the swapped values.  
**6️⃣ Input Format:** Two space-separated integers $A$ and $B$.  
**7️⃣ Output Format:** Two space-separated integers $B$ and $A$.  
**8️⃣ Constraints:** $-10^4 \leq A, B \leq 10^4$  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:** `20 10`  
**1️⃣1️⃣ Explanation:** Store $A$ in `temp`, set $A = B$, set $B = temp$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2` | Output: `2 1`
- **TC 2:** Input: `-5 5` | Output: `5 -5`
- **TC 3:** Input: `0 100` | Output: `100 0`
- **TC 4:** Input: `99 99` | Output: `99 99`
- **TC 5:** Input: `-10 -20` | Output: `-20 -10`  
**1️⃣3️⃣ Tags:** Logic, Variables, Swapping  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_08
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Celsius to Fahrenheit  
**5️⃣ Problem Description:** Write a program to convert temperature from Celsius to Fahrenheit. The formula is: $F = (C \times 9/5) + 32$.  
**6️⃣ Input Format:** A float value $C$ (Celsius).  
**7️⃣ Output Format:** A float value $F$ (Fahrenheit) rounded to 2 decimal places.  
**8️⃣ Constraints:** $-100.0 \leq C \leq 1000.0$  
**9️⃣ Sample Input:** `0`  
**🔟 Sample Output:** `32.00`  
**1️⃣1️⃣ Explanation:** Applying the conversion formula using float arithmetic.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `100` | Output: `212.00`
- **TC 2:** Input: `-40` | Output: `-40.00`
- **TC 3:** Input: `37` | Output: `98.60`
- **TC 4:** Input: `-17.777` | Output: `0.00`
- **TC 5:** Input: `25.5` | Output: `77.90`  
**1️⃣3️⃣ Tags:** Math, Float, Conversion  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_09
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Character Case Toggle  
**5️⃣ Problem Description:** Input an uppercase English alphabet and print its lowercase version. (Constraint: Do not use `tolower()` from `ctype.h`).  
**6️⃣ Input Format:** A single uppercase character.  
**7️⃣ Output Format:** A single lowercase character.  
**8️⃣ Constraints:** Input will be between 'A' and 'Z'.  
**9️⃣ Sample Input:** `G`  
**🔟 Sample Output:** `g`  
**1️⃣1️⃣ Explanation:** Add 32 to the ASCII value of an uppercase character to get its lowercase equivalent.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `A` | Output: `a`
- **TC 2:** Input: `Z` | Output: `z`
- **TC 3:** Input: `M` | Output: `m`
- **TC 4:** Input: `B` | Output: `b`
- **TC 5:** Input: `Q` | Output: `q`  
**1️⃣3️⃣ Tags:** Character, ASCII, Math  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_10
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Simple Interest Calculator  
**5️⃣ Problem Description:** Calculate the Simple Interest based on Principal ($P$), Rate ($R$), and Time ($T$). Formula: $SI = (P \times R \times T) / 100$.  
**6️⃣ Input Format:** Three float values representing Principal, Rate, and Time.  
**7️⃣ Output Format:** The calculated Simple Interest rounded to 2 decimal places.  
**8️⃣ Constraints:** $1 \leq P, R, T \leq 10^5$  
**9️⃣ Sample Input:** `1000 5 2`  
**🔟 Sample Output:** `100.00`  
**1️⃣1️⃣ Explanation:** standard interest calculation using decimals.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2000 7.5 3` | Output: `450.00`
- **TC 2:** Input: `500 10 1` | Output: `50.00`
- **TC 3:** Input: `10000 2.25 5` | Output: `1125.00`
- **TC 4:** Input: `1 1 1` | Output: `0.01`
- **TC 5:** Input: `100000 12 1` | Output: `12000.00`  
**1️⃣3️⃣ Tags:** Math, Float, Variables  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_11
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Average of Three Numbers  
**5️⃣ Problem Description:** Input three integers and calculate their average. The result should be a floating-point number.  
**6️⃣ Input Format:** Three space-separated integers.  
**7️⃣ Output Format:** The average rounded to 3 decimal places.  
**8️⃣ Constraints:** $0 \leq$ Numbers $\leq 10^6$  
**9️⃣ Sample Input:** `10 20 30`  
**🔟 Sample Output:** `20.000`  
**1️⃣1️⃣ Explanation:** Sum the three numbers and divide by 3.0 to ensure float division.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1 1` | Output: `1.000`
- **TC 2:** Input: `5 10 12` | Output: `9.000`
- **TC 3:** Input: `0 0 100` | Output: `33.333`
- **TC 4:** Input: `99 100 101` | Output: `100.000`
- **TC 5:** Input: `123 456 789` | Output: `456.000`  
**1️⃣3️⃣ Tags:** Float Division, Math  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_12
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Net Salary Calculator  
**5️⃣ Problem Description:** A company gives HRA (10% of Basic) and TA (5% of Basic) to its employees. Given the Basic Salary, calculate the Total Salary (Basic + HRA + TA).  
**6️⃣ Input Format:** An integer representing the basic salary.  
**7️⃣ Output Format:** A float representing the total salary rounded to 2 decimal places.  
**8️⃣ Constraints:** $1000 \leq Basic \leq 10^7$  
**9️⃣ Sample Input:** `10000`  
**🔟 Sample Output:** `11500.00`  
**1️⃣1️⃣ Explanation:** HRA = 0.1 * Basic, TA = 0.05 * Basic. Total = Basic + 0.15 * Basic.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `20000` | Output: `23000.00`
- **TC 2:** Input: `5000` | Output: `5750.00`
- **TC 3:** Input: `100000` | Output: `115000.00`
- **TC 4:** Input: `12000` | Output: `13800.00`
- **TC 5:** Input: `1000` | Output: `1150.00`  
**1️⃣3️⃣ Tags:** Percentages, Math, Variables  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_13
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Constant Circle  
**5️⃣ Problem Description:** Define a constant `PI` as `3.14159`. Use it to calculate the circumference of a circle given its radius. Circumference = $2 \times \pi \times r$.  
**6️⃣ Input Format:** A float value representing the radius.  
**7️⃣ Output Format:** The circumference rounded to 4 decimal places.  
**8️⃣ Constraints:** $0 < r \leq 1000$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `31.4159`  
**1️⃣1️⃣ Explanation:** Use `#define` or `const` to store the value of PI.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `6.2832`
- **TC 2:** Input: `10` | Output: `62.8318`
- **TC 3:** Input: `0.5` | Output: `3.1416`
- **TC 4:** Input: `100` | Output: `628.3180`
- **TC 5:** Input: `2.75` | Output: `17.2787`  
**1️⃣3️⃣ Tags:** Constants, Math, Circle  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_14
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Multiple Input Read  
**5️⃣ Problem Description:** Write a program to read one integer, one float, and one character in a single line and print them back separated by " | ".  
**6️⃣ Input Format:** `int` `float` `char` (all in one line, space-separated).  
**7️⃣ Output Format:** `[int] | [float] | [char]` (format float to 2 decimal places).  
**8️⃣ Constraints:** Standard input limits.  
**9️⃣ Sample Input:** `10 5.5 Z`  
**🔟 Sample Output:** `10 | 5.50 | Z`  
**1️⃣1️⃣ Explanation:** Testing ability to use `scanf` with multiple format specifiers.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 0.1 a` | Output: `1 | 0.10 | a`
- **TC 2:** Input: `-5 -6.7 $` | Output: `-5 | -6.70 | $`
- **TC 3:** Input: `100 99.9 9` | Output: `100 | 99.90 | 9`
- **TC 4:** Input: `0 3.141 Q` | Output: `0 | 3.14 | Q`
- **TC 5:** Input: `2024 12.01 M` | Output: `2024 | 12.01 | M`  
**1️⃣3️⃣ Tags:** Basic I/O, scanf  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD1_15
**2️⃣ Module Name:** Introduction, Variables & Data Types  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Days to Years, Weeks, Days  
**5️⃣ Problem Description:** Input a total number of days and convert it into years, weeks, and remaining days. (Assume 1 year = 365 days).  
**6️⃣ Input Format:** A single integer representing days.  
**7️⃣ Output Format:**
Years: [Y]
Weeks: [W]
Days: [D]  
**8️⃣ Constraints:** $0 \leq Days \leq 10^6$  
**9️⃣ Sample Input:** `400`  
**🔟 Sample Output:**
Years: 1
Weeks: 5
Days: 0  
**1️⃣1️⃣ Explanation:** $Y = Days / 365$; Remainder = $Days \% 365$; $W = Remainder / 7$; $D = Remainder \% 7$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `365` | Output: `Years: 1`, `Weeks: 0`, `Days: 0`
- **TC 2:** Input: `7` | Output: `Years: 0`, `Weeks: 1`, `Days: 0`
- **TC 3:** Input: `1000` | Output: `Years: 2`, `Weeks: 38`, `Days: 4`
- **TC 4:** Input: `1` | Output: `Years: 0`, `Weeks: 0`, `Days: 1`
- **TC 5:** Input: `0` | Output: `Years: 0`, `Weeks: 0`, `Days: 0`  
**1️⃣3️⃣ Tags:** Arithmetic, Logic, Conversion  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

## MODULE 2: Operators & Expressions

---

### 1️⃣ Question ID: C_MOD2_16
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** The Remainder Finder  
**5️⃣ Problem Description:** Write a program that takes two integers $A$ and $B$, and calculates the remainder when $A$ is divided by $B$.  
**6️⃣ Input Format:** Two space-separated integers $A$ and $B$.  
**7️⃣ Output Format:** A single integer representing $A \% B$.  
**8️⃣ Constraints:** $1 \leq A \leq 10^9$, $1 \leq B \leq 10^9$  
**9️⃣ Sample Input:** `17 5`  
**🔟 Sample Output:** `2`  
**1️⃣1️⃣ Explanation:** The `%` (modulus) operator is used to find the remainder of division.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 3` | Output: `1`
- **TC 2:** Input: `100 10` | Output: `0`
- **TC 3:** Input: `7 8` | Output: `7`
- **TC 4:** Input: `1000000 3` | Output: `1`
- **TC 5:** Input: `15 4` | Output: `3`  
**1️⃣3️⃣ Tags:** Arithmetic, Modulus  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_17
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Increment and Decrement  
**5️⃣ Problem Description:** Given an integer $X$, perform the following sequence of operations: 1. Increment $X$ by 1. 2. Decrement $X$ by 2. 3. Increment $X$ by 5. Print the final value of $X$.  
**6️⃣ Input Format:** A single integer $X$.  
**7️⃣ Output Format:** A single integer representing the final value.  
**8️⃣ Constraints:** $-10^4 \leq X \leq 10^4$  
**9️⃣ Sample Input:** `10`  
**🔟 Sample Output:** `14`  
**1️⃣1️⃣ Explanation:** $10 + 1 = 11$; $11 - 2 = 9$; $9 + 5 = 14$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `4`
- **TC 2:** Input: `-5` | Output: `-1`
- **TC 3:** Input: `100` | Output: `104`
- **TC 4:** Input: `-4` | Output: `0`
- **TC 5:** Input: `1234` | Output: `1238`  
**1️⃣3️⃣ Tags:** Unary Operators, Arithmetic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_18
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Relational Check  
**5️⃣ Problem Description:** Input two integers $A$ and $B$. Print `1` if $A$ is greater than $B$, and `0` otherwise.  
**6️⃣ Input Format:** Two space-separated integers $A$ and $B$.  
**7️⃣ Output Format:** An integer (`1` or `0`).  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `15 10`  
**🔟 Sample Output:** `1`  
**1️⃣1️⃣ Explanation:** Relational operators like `>` return a boolean-like integer (1 for true, 0 for false) in C.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 20` | Output: `0`
- **TC 2:** Input: `5 5` | Output: `0`
- **TC 3:** Input: `-1 -5` | Output: `1`
- **TC 4:** Input: `0 0` | Output: `0`
- **TC 5:** Input: `99 98` | Output: `1`  
**1️⃣3️⃣ Tags:** Relational Operators, Comparison  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_19
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Logical AND Gate  
**5️⃣ Problem Description:** Input two integers $A$ and $B$. Print `1` if BOTH $A$ and $B$ are non-zero. Otherwise, print `0`.  
**6️⃣ Input Format:** Two space-separated integers.  
**7️⃣ Output Format:** An integer (`1` or `0`).  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `5 2`  
**🔟 Sample Output:** `1`  
**1️⃣1️⃣ Explanation:** The logical AND operator `&&` returns 1 if both operands are true (non-zero in C).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0 10` | Output: `0`
- **TC 2:** Input: `7 0` | Output: `0`
- **TC 3:** Input: `0 0` | Output: `0`
- **TC 4:** Input: `-5 -5` | Output: `1`
- **TC 5:** Input: `1 1` | Output: `1`  
**1️⃣3️⃣ Tags:** Logical Operators, Boolean Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_20
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Assignment with Flavour  
**5️⃣ Problem Description:** Start with a variable `sum = 0`. Given five integers, add each one to `sum` using the shorthand assignment operator `+=` and print the final value of `sum`.  
**6️⃣ Input Format:** Five space-separated integers.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $-1000 \leq Numbers \leq 1000$  
**9️⃣ Sample Input:** `1 2 3 4 5`  
**🔟 Sample Output:** `15`  
**1️⃣1️⃣ Explanation:** `sum += a; sum += b; ...` results in the total sum.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0 0 0 0 0` | Output: `0`
- **TC 2:** Input: `10 -10 20 -20 5` | Output: `5`
- **TC 3:** Input: `100 100 100 100 100` | Output: `500`
- **TC 4:** Input: `-1 -2 -3 -4 -5` | Output: `-15`
- **TC 5:** Input: `1 0 1 0 1` | Output: `3`  
**1️⃣3️⃣ Tags:** Assignment Operators, Arithmetic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_21
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Ternary Minimum  
**5️⃣ Problem Description:** Input two integers and find the minimum of the two using the **Ternary Operator** (`? :`).  
**6️⃣ Input Format:** Two space-separated integers.  
**7️⃣ Output Format:** A single integer (the smaller one).  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:** `10`  
**1️⃣1️⃣ Explanation:** `min = (a < b) ? a : b;`  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5 5` | Output: `5`
- **TC 2:** Input: `-10 -5` | Output: `-10`
- **TC 3:** Input: `0 100` | Output: `0`
- **TC 4:** Input: `99 98` | Output: `98`
- **TC 5:** Input: `-100 -200` | Output: `-200`  
**1️⃣3️⃣ Tags:** Ternary Operator, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_22
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Bitwise AND Explorer  
**5️⃣ Problem Description:** Input two integers and print the result of their bitwise AND operation.  
**6️⃣ Input Format:** Two integers $A$ and $B$.  
**7️⃣ Output Format:** A single integer representing $A \& B$.  
**8️⃣ Constraints:** $0 \leq A, B \leq 1024$  
**9️⃣ Sample Input:** `12 25`  
**🔟 Sample Output:** `8`  
**1️⃣1️⃣ Explanation:** `12` is `01100`, `25` is `11001`. `01100 & 11001` is `01000` (which is `8`).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0 5` | Output: `0`
- **TC 2:** Input: `7 7` | Output: `7`
- **TC 3:** Input: `1 2` | Output: `0`
- **TC 4:** Input: `10 6` | Output: `2`
- **TC 5:** Input: `15 15` | Output: `15`  
**1️⃣3️⃣ Tags:** Bitwise, Operators  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_23
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Left Shift Power  
**5️⃣ Problem Description:** Given an integer $N$ and an integer $K$, calculate $N \times 2^K$ using the **Left Shift operator** (`<<`).  
**6️⃣ Input Format:** Two space-separated integers $N$ and $K$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq N \leq 100$, $1 \leq K \leq 10$  
**9️⃣ Sample Input:** `5 2`  
**🔟 Sample Output:** `20`  
**1️⃣1️⃣ Explanation:** $5 \ll 2$ is $5 \times 2^2 = 20$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1` | Output: `2`
- **TC 2:** Input: `10 3` | Output: `80`
- **TC 3:** Input: `3 0` | Output: `3`
- **TC 4:** Input: `2 10` | Output: `2048`
- **TC 5:** Input: `7 4` | Output: `112`  
**1️⃣3️⃣ Tags:** Bitwise, Left Shift, Math  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_24
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Even or Odd without IF  
**5️⃣ Problem Description:** Determine if a number is Even or Odd using the **Bitwise AND** operator (`&`). Print `1` for Odd and `0` for Even.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** `1` or `0`.  
**8️⃣ Constraints:** $0 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `7`  
**🔟 Sample Output:** `1`  
**1️⃣1️⃣ Explanation:** Any odd number has its last bit set to 1. Thus, `N & 1` is 1 for odd numbers.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10` | Output: `0`
- **TC 2:** Input: `0` | Output: `0`
- **TC 3:** Input: `1` | Output: `1`
- **TC 4:** Input: `999` | Output: `1`
- **TC 5:** Input: `1000000` | Output: `0`  
**1️⃣3️⃣ Tags:** Bitwise, Logic, Even-Odd  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_25
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Size of Expressions  
**5️⃣ Problem Description:** What is the size of the expression `(a + b)` where `a` is an `int` and `b` is a `double`? Print the size in bytes.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `8`  
**1️⃣1️⃣ Explanation:** When an `int` is added to a `double`, the result is promoted to a `double`. The size of a `double` is typically 8 bytes.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Output is `8`  
**1️⃣3️⃣ Tags:** Type Promotion, sizeof  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_26
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Commas in C  
**5️⃣ Problem Description:** In the expression `x = (a = 5, b = 10, a + b)`, what is the final value assigned to `x`? Write a program that takes two integers $A$ and $B$, calculates this expression, and prints $X$.  
**6️⃣ Input Format:** Two integers $A$ and $B$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `5 10`  
**🔟 Sample Output:** `15`  
**1️⃣1️⃣ Explanation:** The comma operator evaluates each expression from left to right and returns the value of the last expression.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2` | Output: `3`
- **TC 2:** Input: `10 20` | Output: `30`
- **TC 3:** Input: `-5 5` | Output: `0`
- **TC 4:** Input: `0 0` | Output: `0`
- **TC 5:** Input: `100 -50` | Output: `50`  
**1️⃣3️⃣ Tags:** Comma Operator, Expressions  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_27
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Bitwise XOR Swap  
**5️⃣ Problem Description:** Swap two integers $A$ and $B$ without using a temporary variable by using the **Bitwise XOR** operator (`^`). Print the swapped values.  
**6️⃣ Input Format:** Two space-separated integers $A$ and $B$.  
**7️⃣ Output Format:** Two space-separated integers $B$ and $A$.  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `3 5`  
**🔟 Sample Output:** `5 3`  
**1️⃣1️⃣ Explanation:** $A = A \wedge B$; $B = A \wedge B$; $A = A \wedge B$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 20` | Output: `20 10`
- **TC 2:** Input: `0 5` | Output: `5 0`
- **TC 3:** Input: `7 7` | Output: `7 7`
- **TC 4:** Input: `-1 -2` | Output: `-2 -1`
- **TC 5:** Input: `100 0` | Output: `0 100`  
**1️⃣3️⃣ Tags:** Bitwise, XOR, Swapping  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_28
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Not Logically Zero  
**5️⃣ Problem Description:** Input an integer and print its logical negation result using the `!` operator.  
**6️⃣ Input Format:** An integer $N$.  
**7️⃣ Output Format:** `1` if $N$ is zero, and `0` otherwise.  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `0`  
**1️⃣1️⃣ Explanation:** `!5` is `0`, `!0` is `1`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `1`
- **TC 2:** Input: `1` | Output: `0`
- **TC 3:** Input: `-1` | Output: `0`
- **TC 4:** Input: `100` | Output: `0`
- **TC 5:** Input: `-0` | Output: `1`  
**1️⃣3️⃣ Tags:** Logical NOT, Boolean Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_29
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Power of Two Check  
**5️⃣ Problem Description:** Check if a given positive integer $N$ is a power of 2 using only bitwise operators. Print `Yes` or `No`.  
**6️⃣ Input Format:** A positive integer $N$.  
**7️⃣ Output Format:** `Yes` or `No`.  
**8️⃣ Constraints:** $1 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `16`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** A number $N$ is a power of 2 if `(N & (N - 1)) == 0`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `8` | Output: `Yes`
- **TC 2:** Input: `7` | Output: `No`
- **TC 3:** Input: `1` | Output: `Yes`
- **TC 4:** Input: `10` | Output: `No`
- **TC 5:** Input: `1024` | Output: `Yes`  
**1️⃣3️⃣ Tags:** Bitwise, Logic, Powers  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD2_30
**2️⃣ Module Name:** Operators & Expressions  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Expression Priority  
**5️⃣ Problem Description:** Evaluate the following expression based on C operator precedence: result = $A + B * C / D - E \% F$. Input the values and print the result.  
**6️⃣ Input Format:** Six space-separated integers $A, B, C, D, E, F$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** All intermediate results fit in an integer. $D, F \neq 0$.  
**9️⃣ Sample Input:** `10 5 4 2 8 3`  
**🔟 Sample Output:** `18`  
**1️⃣1️⃣ Explanation:** $10 + (5 * 4 / 2) - (8 \% 3) = 10 + 10 - 2 = 18$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2 3 1 4 2` | Output: `7`
- **TC 2:** Input: `10 10 10 10 10 10` | Output: `10`
- **TC 3:** Input: `0 1 1 1 1 1` | Output: `1`
- **TC 4:** Input: `100 10 2 5 20 7` | Output: `98`
- **TC 5:** Input: `5 5 5 5 5 5` | Output: `5`  
**1️⃣3️⃣ Tags:** Precedence, Arithmetic, Expressions  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

## MODULE 3: Conditional Statements (if-else, switch)

---

### 1️⃣ Question ID: C_MOD3_31
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Pass or Fail  
**5️⃣ Problem Description:** Write a program that takes a student's marks as input and prints "Pass" if the marks are 40 or above, and "Fail" otherwise.  
**6️⃣ Input Format:** A single integer representing marks.  
**7️⃣ Output Format:** "Pass" or "Fail".  
**8️⃣ Constraints:** $0 \leq Marks \leq 100$  
**9️⃣ Sample Input:** `45`  
**🔟 Sample Output:** `Pass`  
**1️⃣1️⃣ Explanation:** Simple `if-else` condition.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `40` | Output: `Pass`
- **TC 2:** Input: `39` | Output: `Fail`
- **TC 3:** Input: `100` | Output: `Pass`
- **TC 4:** Input: `0` | Output: `Fail`
- **TC 5:** Input: `75` | Output: `Pass`  
**1️⃣3️⃣ Tags:** If-Else, Beginner  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_32
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Maximum of Three  
**5️⃣ Problem Description:** Input three integers and find the largest among them using `if-else`.  
**6️⃣ Input Format:** Three space-separated integers.  
**7️⃣ Output Format:** A single integer (the largest).  
**8️⃣ Constraints:** Standard integer range.  
**9️⃣ Sample Input:** `10 25 15`  
**🔟 Sample Output:** `25`  
**1️⃣1️⃣ Explanation:** Use nested `if-else` or logical operators to compare the three numbers.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2 3` | Output: `3`
- **TC 2:** Input: `10 10 5` | Output: `10`
- **TC 3:** Input: `-5 -2 -10` | Output: `-2`
- **TC 4:** Input: `100 0 50` | Output: `100`
- **TC 5:** Input: `7 7 7` | Output: `7`  
**1️⃣3️⃣ Tags:** If-Else, Comparison  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_33
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Leap Year Checker  
**5️⃣ Problem Description:** Determine if a given year is a Leap Year. A year is leap if it is divisible by 4, but not by 100, unless it is also divisible by 400.  
**6️⃣ Input Format:** A single integer representing the year.  
**7️⃣ Output Format:** "Leap Year" or "Not a Leap Year".  
**8️⃣ Constraints:** $1 \leq Year \leq 9999$  
**9️⃣ Sample Input:** `2000`  
**🔟 Sample Output:** `Leap Year`  
**1️⃣1️⃣ Explanation:** Standard leap year logic using modulus operator.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1900` | Output: `Not a Leap Year`
- **TC 2:** Input: `2024` | Output: `Leap Year`
- **TC 3:** Input: `2023` | Output: `Not a Leap Year`
- **TC 4:** Input: `1600` | Output: `Leap Year`
- **TC 5:** Input: `2100` | Output: `Not a Leap Year`  
**1️⃣3️⃣ Tags:** If-Else, Math, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_34
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Vowel or Consonant  
**5️⃣ Problem Description:** Input a single alphabet and check whether it is a vowel (a, e, i, o, u) or a consonant. Handle both uppercase and lowercase inputs.  
**6️⃣ Input Format:** A single character.  
**7️⃣ Output Format:** "Vowel" or "Consonant".  
**8️⃣ Constraints:** Input will be an English alphabet.  
**9️⃣ Sample Input:** `E`  
**🔟 Sample Output:** `Vowel`  
**1️⃣1️⃣ Explanation:** Use a `switch` statement or an `if` condition with multiple `||` operators.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `a` | Output: `Vowel`
- **TC 2:** Input: `B` | Output: `Consonant`
- **TC 3:** Input: `i` | Output: `Vowel`
- **TC 4:** Input: `z` | Output: `Consonant`
- **TC 5:** Input: `U` | Output: `Vowel`  
**1️⃣3️⃣ Tags:** Switch, If-Else, Character  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_35
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Grade Calculator  
**5️⃣ Problem Description:** Give grades based on marks:
- 90-100: A
- 80-89: B
- 70-79: C
- 60-69: D
- Below 60: F  
**6️⃣ Input Format:** A single integer.  
**7️⃣ Output Format:** A single character representing the grade.  
**8️⃣ Constraints:** $0 \leq Marks \leq 100$  
**9️⃣ Sample Input:** `85`  
**🔟 Sample Output:** `B`  
**1️⃣1️⃣ Explanation:** Use an `if-else if-else` ladder.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `90` | Output: `A`
- **TC 2:** Input: `79` | Output: `C`
- **TC 3:** Input: `60` | Output: `D`
- **TC 4:** Input: `55` | Output: `F`
- **TC 5:** Input: `100` | Output: `A`  
**1️⃣3️⃣ Tags:** If-Else Ladder, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_36
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Day of the Week  
**5️⃣ Problem Description:** Input an integer (1-7) and print the corresponding day of the week (1=Monday, 2=Tuesday, ..., 7=Sunday). Use a `switch` statement. If the input is outside 1-7, print "Invalid Input".  
**6️⃣ Input Format:** A single integer.  
**7️⃣ Output Format:** String representing the day or "Invalid Input".  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:** `Wednesday`  
**1️⃣1️⃣ Explanation:** `switch(day) { case 1: ... case 7: ... default: ... }`  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `Monday`
- **TC 2:** Input: `7` | Output: `Sunday`
- **TC 3:** Input: `5` | Output: `Friday`
- **TC 4:** Input: `0` | Output: `Invalid Input`
- **TC 5:** Input: `8` | Output: `Invalid Input`  
**1️⃣3️⃣ Tags:** Switch Case, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_37
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Quadrant Finder  
**5️⃣ Problem Description:** Given the $(X, Y)$ coordinates of a point, find the quadrant in which it lies:
- Q1: $X>0, Y>0$
- Q2: $X<0, Y>0$
- Q3: $X<0, Y<0$
- Q4: $X>0, Y<0$
- If on origin: "Origin"
- If on axis: "On Axis"  
**6️⃣ Input Format:** Two space-separated integers $X$ and $Y$.  
**7️⃣ Output Format:** "Q1", "Q2", "Q3", "Q4", "Origin", or "On Axis".  
**8️⃣ Constraints:** $-1000 \leq X, Y \leq 1000$  
**9️⃣ Sample Input:** `-5 10`  
**🔟 Sample Output:** `Q2`  
**1️⃣1️⃣ Explanation:** Use nested `if-else` to check signs of $X$ and $Y$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 10` | Output: `Q1`
- **TC 2:** Input: `-5 -5` | Output: `Q3`
- **TC 3:** Input: `0 0` | Output: `Origin`
- **TC 4:** Input: `5 0` | Output: `On Axis`
- **TC 5:** Input: `2 -3` | Output: `Q4`  
**1️⃣3️⃣ Tags:** If-Else, Coordinates, Geometry  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_38
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Number Sign and Parity  
**5️⃣ Problem Description:** Input an integer and check if it is "Positive Even", "Positive Odd", "Negative Even", "Negative Odd", or "Zero".  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** One of the five specified strings.  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `-4`  
**🔟 Sample Output:** `Negative Even`  
**1️⃣1️⃣ Explanation:** Combine sign check ($N>0$) and parity check ($N\%2==0$).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10` | Output: `Positive Even`
- **TC 2:** Input: `7` | Output: `Positive Odd`
- **TC 3:** Input: `-3` | Output: `Negative Odd`
- **TC 4:** Input: `0` | Output: `Zero`
- **TC 5:** Input: `-100` | Output: `Negative Even`  
**1️⃣3️⃣ Tags:** Nested If-Else, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_39
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Eligibility to Vote  
**5️⃣ Problem Description:** A person is eligible to vote if their age is 18 or above. Input the age and print "Eligible" or "Not Eligible". If the age is less than 0, print "Invalid Age".  
**6️⃣ Input Format:** A single integer.  
**7️⃣ Output Format:** String response.  
**8️⃣ Constraints:** $-100 \leq Age \leq 150$  
**9️⃣ Sample Input:** `21`  
**🔟 Sample Output:** `Eligible`  
**1️⃣1️⃣ Explanation:** Simple threshold check with validation.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `18` | Output: `Eligible`
- **TC 2:** Input: `17` | Output: `Not Eligible`
- **TC 3:** Input: `-5` | Output: `Invalid Age`
- **TC 4:** Input: `0` | Output: `Not Eligible`
- **TC 5:** Input: `100` | Output: `Eligible`  
**1️⃣3️⃣ Tags:** If-Else, Validation  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_40
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Calculator Switch  
**5️⃣ Problem Description:** Take two numbers and an operator (+, -, *, /) as input. Perform the operation and print the result. If the operator is not one of these, print "Error". For division, check if the second number is zero before dividing; if it is, print "Division by Zero Error".  
**6️⃣ Input Format:** `float` `char` `float` (e.g., `10 + 5`).  
**7️⃣ Output Format:** Result formatted to 2 decimal places or error message.  
**8️⃣ Constraints:** Standard float range.  
**9️⃣ Sample Input:** `20 / 4`  
**🔟 Sample Output:** `5.00`  
**1️⃣1️⃣ Explanation:** Use `switch(operator)` and `if` for zero division check.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 + 2` | Output: `12.00`
- **TC 2:** Input: `5 * 0` | Output: `0.00`
- **TC 3:** Input: `10 / 0` | Output: `Division by Zero Error`
- **TC 4:** Input: `10 ^ 2` | Output: `Error`
- **TC 5:** Input: `15.5 - 5.5` | Output: `10.00`  
**1️⃣3️⃣ Tags:** Switch Case, If-Else, Calculator  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_41
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Triangle Validator  
**5️⃣ Problem Description:** Input three angles of a triangle and check if it is valid (Sum of angles should be exactly 180 degrees and each angle must be > 0).  
**6️⃣ Input Format:** Three integers representing angles.  
**7️⃣ Output Format:** "Valid" or "Invalid".  
**8️⃣ Constraints:** $0 \leq Angle \leq 360$  
**9️⃣ Sample Input:** `60 60 60`  
**🔟 Sample Output:** `Valid`  
**1️⃣1️⃣ Explanation:** $A + B + C = 180$ and $A, B, C > 0$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `90 45 45` | Output: `Valid`
- **TC 2:** Input: `100 50 30` | Output: `Valid`
- **TC 3:** Input: `0 90 90` | Output: `Invalid`
- **TC 4:** Input: `60 60 70` | Output: `Invalid`
- **TC 5:** Input: `180 0 0` | Output: `Invalid`  
**1️⃣3️⃣ Tags:** If-Else, Math, Geonetry  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_42
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Character Finder  
**5️⃣ Problem Description:** Input a character and check if it is an Uppercase alphabet, Lowercase alphabet, Digit, or Special Character.  
**6️⃣ Input Format:** A single character $C$.  
**7️⃣ Output Format:** "Uppercase", "Lowercase", "Digit", or "Special Character".  
**8️⃣ Constraints:** Any ASCII character.  
**9️⃣ Sample Input:** `7`  
**🔟 Sample Output:** `Digit`  
**1️⃣1️⃣ Explanation:** Use ASCII ranges: 'A'-'Z' (65-90), 'a'-'z' (97-122), '0'-'9' (48-57).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `G` | Output: `Uppercase`
- **TC 2:** Input: `m` | Output: `Lowercase`
- **TC 3:** Input: `$` | Output: `Special Character`
- **TC 4:** Input: `0` | Output: `Digit`
- **TC 5:** Input: ` ` | Output: `Special Character`  
**1️⃣3️⃣ Tags:** If-Else, Character, ASCII  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_43
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Electricity Bill Calculator  
**5️⃣ Problem Description:** Calculate the electricity bill based on units consumed:
- First 100 units: Rs. 5 per unit
- Next 200 units: Rs. 7 per unit
- Beyond 300 units: Rs. 10 per unit
Input the units and print the total bill.  
**6️⃣ Input Format:** A single integer (units).  
**7️⃣ Output Format:** A float representing the bill rounded to 2 decimal places.  
**8️⃣ Constraints:** $0 \leq Units \leq 10^5$  
**9️⃣ Sample Input:** `150`  
**🔟 Sample Output:** `850.00`  
**1️⃣1️⃣ Explanation:** (100 * 5) + (50 * 7) = 500 + 350 = 850.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `50` | Output: `250.00`
- **TC 2:** Input: `100` | Output: `500.00`
- **TC 3:** Input: `300` | Output: `1900.00`
- **TC 4:** Input: `400` | Output: `2900.00`
- **TC 5:** Input: `0` | Output: `0.00`  
**1️⃣3️⃣ Tags:** If-Else Ladder, Real-world Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_44
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Roots of a Quadratic Equation  
**5️⃣ Problem Description:** Find the nature of roots for a quadratic equation $ax^2 + bx + c = 0$ based on its discriminant ($D = b^2 - 4ac$):
- $D > 0$: "Real and Distinct"
- $D = 0$: "Real and Equal"
- $D < 0$: "Imaginary"  
**6️⃣ Input Format:** Three integers $A, B, C$.  
**7️⃣ Output Format:** nature of roots (strings).  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `1 -5 6`  
**🔟 Sample Output:** `Real and Distinct`  
**1️⃣1️⃣ Explanation:** $D = (-5)^2 - 4(1)(6) = 25 - 24 = 1$. Since $D > 0$, roots are real and distinct.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2 1` | Output: `Real and Equal`
- **TC 2:** Input: `1 1 1` | Output: `Imaginary`
- **TC 3:** Input: `2 4 2` | Output: `Real and Equal`
- **TC 4:** Input: `1 0 -4` | Output: `Real and Distinct`
- **TC 5:** Input: `5 2 1` | Output: `Imaginary`  
**1️⃣3️⃣ Tags:** If-Else, Math, Discriminant  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD3_45
**2️⃣ Module Name:** Conditional Statements  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** ATM Withdrawal  
**5️⃣ Problem Description:** An ATM allows withdrawals in multiples of 100. The user has an initial balance of Rs. 10,000. Take the withdrawal amount as input. If the amount is not a multiple of 100, print "Invalid Amount". If the balance is insufficient, print "Insufficient Balance". Otherwise, print "Withdrawal Successful" and the remaining balance.  
**6️⃣ Input Format:** A single integer (Withdrawal Amount).  
**7️⃣ Output Format:** Specified message and balance if successful.  
**8️⃣ Constraints:** $0 \leq Amount \leq 20000$  
**9️⃣ Sample Input:** `500`  
**🔟 Sample Output:**
Withdrawal Successful
Remaining Balance: 9500  
**1️⃣1️⃣ Explanation:** Check `amount % 100 == 0` first, then compare with balance.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1000` | Output: `Withdrawal Successful`, `Remaining Balance: 9000`
- **TC 2:** Input: `150` | Output: `Invalid Amount`
- **TC 3:** Input: `15000` | Output: `Insufficient Balance`
- **TC 4:** Input: `10000` | Output: `Withdrawal Successful`, `Remaining Balance: 0`
- **TC 5:** Input: `0` | Output: `Withdrawal Successful`, `Remaining Balance: 10000`  
**1️⃣3️⃣ Tags:** If-Else, Real-world Logic, Validation  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

## MODULE 4: Loops – I (for, while, do-while)

---

### 1️⃣ Question ID: C_MOD4_46
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Print N Numbers  
**5️⃣ Problem Description:** Write a program that takes an integer $N$ as input and prints all numbers from 1 to $N$ separated by space.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Numbers from 1 to $N$ separated by space.  
**8️⃣ Constraints:** $1 \leq N \leq 1000$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `1 2 3 4 5`  
**1️⃣1️⃣ Explanation:** Use a `for` loop from 1 to $N$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `1`
- **TC 2:** Input: `10` | Output: `1 2 3 4 5 6 7 8 9 10`
- **TC 3:** Input: `3` | Output: `1 2 3`
- **TC 4:** Input: `0` | Output: (Empty)
- **TC 5:** Input: `5` | Output: `1 2 3 4 5`  
**1️⃣3️⃣ Tags:** For Loop, Beginner  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_47
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Sum of First N Natural Numbers  
**5️⃣ Problem Description:** Write a program to calculate the sum of the first $N$ natural numbers using a `while` loop.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer representing the sum.  
**8️⃣ Constraints:** $1 \leq N \leq 10^4$  
**9️⃣ Sample Input:** `10`  
**🔟 Sample Output:** `55`  
**1️⃣1️⃣ Explanation:** Initialize `sum = 0` and increment in a loop until $N$ is reached.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `1`
- **TC 2:** Input: `5` | Output: `15`
- **TC 3:** Input: `100` | Output: `5050`
- **TC 4:** Input: `0` | Output: `0`
- **TC 5:** Input: `10` | Output: `55`  
**1️⃣3️⃣ Tags:** While Loop, Math  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_48
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Factorial Finder  
**5️⃣ Problem Description:** Calculate the factorial of a given number $N$ using a loop. (Factorial of $N = 1 \times 2 \times 3 \times \dots \times N$).  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer representing $N!$.  
**8️⃣ Constraints:** $0 \leq N \leq 12$ (to fit in a 32-bit int).  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `120`  
**1️⃣1️⃣ Explanation:** $5! = 5 \times 4 \times 3 \times 2 \times 1 = 120$. Factorial of 0 is 1.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `1`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `4` | Output: `24`
- **TC 4:** Input: `6` | Output: `720`
- **TC 5:** Input: `10` | Output: `3628800`  
**1️⃣3️⃣ Tags:** Loops, Factorial, Math  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_49
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Table of a Number  
**5️⃣ Problem Description:** Input a number $N$ and print its multiplication table from 1 to 10 in the format: `N x 1 = Result`.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** 10 lines, each containing one multiplication step.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:**
5 x 1 = 5
5 x 2 = 10
...
5 x 10 = 50  
**1️⃣1️⃣ Explanation:** Use a loop from 1 to 10 and print `N * i`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output contains `1 x 1 = 1` and `1 x 10 = 10`
- **TC 2:** Input: `10` | Output contains `10 x 5 = 50`
- **TC 3:** Input: `7` | Output contains `7 x 7 = 49`
- **TC 4:** Input: `100` | Output contains `100 x 1 = 100`
- **TC 5:** Input: `5` | Output lines correct.  
**1️⃣3️⃣ Tags:** For Loop, Basic Math  
**1️⃣4️⃣ Time Complexity:** O(1) (fixed loop size)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_50
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Count Digits  
**5️⃣ Problem Description:** Input an integer and count the total number of digits it contains.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer (the count of digits).  
**8️⃣ Constraints:** $-10^{18} \leq N \leq 10^{18}$ (Use `long long`).  
**9️⃣ Sample Input:** `12345`  
**🔟 Sample Output:** `5`  
**1️⃣1️⃣ Explanation:** Repeatedly divide the number by 10 in a loop and count the steps. Handle $N=0$ specifically.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `1`
- **TC 2:** Input: `7` | Output: `1`
- **TC 3:** Input: `1000` | Output: `4`
- **TC 4:** Input: `-123` | Output: `3`
- **TC 5:** Input: `999999999999` | Output: `12`  
**1️⃣3️⃣ Tags:** While Loop, Number Logic  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_51
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Reverse a Number  
**5️⃣ Problem Description:** Input an integer and output its reverse. For example, input `123`, output `321`. Handle numbers ending in zeros.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer (the reversed number).  
**8️⃣ Constraints:** $-10^9 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `120`  
**🔟 Sample Output:** `21`  
**1️⃣1️⃣ Explanation:** Extract digits using `N % 10` and build the reverse number using `rev = rev * 10 + digit`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `123` | Output: `321`
- **TC 2:** Input: `5` | Output: `5`
- **TC 3:** Input: `100` | Output: `1`
- **TC 4:** Input: `-456` | Output: `-654`
- **TC 5:** Input: `0` | Output: `0`  
**1️⃣3️⃣ Tags:** Number Logic, While Loop  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_52
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Even Numbers in Range  
**5️⃣ Problem Description:** Given a range $[A, B]$, print all even numbers within this range inclusive, separated by space.  
**6️⃣ Input Format:** Two space-separated integers $A$ and $B$.  
**7️⃣ Output Format:** Even numbers separated by space.  
**8️⃣ Constraints:** $0 \leq A \leq B \leq 1000$  
**9️⃣ Sample Input:** `4 10`  
**🔟 Sample Output:** `4 6 8 10`  
**1️⃣1️⃣ Explanation:** Loop from $A$ to $B$ and check if `i % 2 == 0`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 5` | Output: `2 4`
- **TC 2:** Input: `10 10` | Output: `10`
- **TC 3:** Input: `11 11` | Output: (Empty)
- **TC 4:** Input: `0 3` | Output: `0 2`
- **TC 5:** Input: `10 20` | Output: `10 12 14 16 18 20`  
**1️⃣3️⃣ Tags:** For Loop, If Condition  
**1️⃣4️⃣ Time Complexity:** O(B-A)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_53
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Palindrome Number  
**5️⃣ Problem Description:** Check if a given integer is a Palindrome (reads the same forward and backward). Print "Yes" or "No".  
**6️⃣ Input Format:** A positive integer $N$.  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** $0 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `121`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Reverse the number and compare it with the original value.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `121` | Output: `Yes`
- **TC 2:** Input: `123` | Output: `No`
- **TC 3:** Input: `7` | Output: `Yes`
- **TC 4:** Input: `10` | Output: `No`
- **TC 5:** Input: `110011` | Output: `Yes`  
**1️⃣3️⃣ Tags:** Palindrome, Number Logic, While Loop  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_54
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Power of a Number  
**5️⃣ Problem Description:** Input base $B$ and exponent $E$. Calculate $B^E$ using a loop. (Constraint: Do not use `pow()` from `math.h`).  
**6️⃣ Input Format:** Two space-separated integers $B$ and $E$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq B \leq 10$, $0 \leq E \leq 10$  
**9️⃣ Sample Input:** `2 3`  
**🔟 Sample Output:** `8`  
**1️⃣1️⃣ Explanation:** Multiply result by $B$, $E$ times.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5 0` | Output: `1`
- **TC 2:** Input: `3 2` | Output: `9`
- **TC 3:** Input: `10 4` | Output: `10000`
- **TC 4:** Input: `1 100` | Output: `1`
- **TC 5:** Input: `7 2` | Output: `49`  
**1️⃣3️⃣ Tags:** For Loop, Math  
**1️⃣4️⃣ Time Complexity:** O(E)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_55
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Fibonacci Sequence  
**5️⃣ Problem Description:** Print the first $N$ terms of the Fibonacci sequence starting with `0` and `1`. (Sequence: 0, 1, 1, 2, 3, 5, 8, ...).  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** $N$ integers separated by space.  
**8️⃣ Constraints:** $1 \leq N \leq 30$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `0 1 1 2 3`  
**1️⃣1️⃣ Explanation:** Use three variables to keep track of previous terms.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `0`
- **TC 2:** Input: `2` | Output: `0 1`
- **TC 3:** Input: `3` | Output: `0 1 1`
- **TC 4:** Input: `10` | Output: `0 1 1 2 3 5 8 13 21 34`
- **TC 5:** Input: `5` | Output: `0 1 1 2 3`  
**1️⃣3️⃣ Tags:** Fibonacci, Loops  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_56
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Average Until Zero  
**5️⃣ Problem Description:** Write a program that takes integers as input continuously until the user enters `0`. Then, print the sum and average of all entered numbers (excluding the 0).  
**6️⃣ Input Format:** A sequence of integers ending with 0.  
**7️⃣ Output Format:**
Sum: [S]
Average: [A] (formatted to 2 decimal places)  
**8️⃣ Constraints:** Total numbers entered $\leq 100$.  
**9️⃣ Sample Input:** `10 20 30 0`  
**🔟 Sample Output:**
Sum: 60
Average: 20.00  
**1️⃣1️⃣ Explanation:** Use a `do-while` loop or `while(1)` with a break condition.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5 0` | Output: `Sum: 5`, `Average: 5.00`
- **TC 2:** Input: `0` | Output: `Sum: 0`, `Average: 0.00`
- **TC 3:** Input: `1 2 3 4 5 0` | Output: `Sum: 15`, `Average: 3.00`
- **TC 4:** Input: `10 -10 10 0` | Output: `Sum: 10`, `Average: 3.33`
- **TC 5:** Input: `-5 -5 0` | Output: `Sum: -10`, `Average: -5.00`  
**1️⃣3️⃣ Tags:** Sentinel Loops, Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_57
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** GCD (Greatest Common Divisor)  
**5️⃣ Problem Description:** Find the GCD of two integers $A$ and $B$ using a loop (Euclidean algorithm or simple subtraction/division).  
**6️⃣ Input Format:** Two space-separated integers.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq A, B \leq 10^9$  
**9️⃣ Sample Input:** `12 18`  
**🔟 Sample Output:** `6`  
**1️⃣1️⃣ Explanation:** The largest number that divides both 12 and 18 is 6.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 5` | Output: `5`
- **TC 2:** Input: `13 17` | Output: `1`
- **TC 3:** Input: `100 25` | Output: `25`
- **TC 4:** Input: `48 36` | Output: `12`
- **TC 5:** Input: `7 0` (Wait, constraints say $\geq 1$) -> Input: `7 7` | Output: `7`  
**1️⃣3️⃣ Tags:** Math, GCD, Loops  
**1️⃣4️⃣ Time Complexity:** O(log(min(A,B)))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_58
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Alphabet Ladder  
**5️⃣ Problem Description:** Print all alphabets from 'A' to 'Z' separated by space using a single loop.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** `A B C ... Z`  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`  
**1️⃣1️⃣ Explanation:** Use a `char` variable in the loop condition: `for(char c='A'; c<='Z'; c++)`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Output correct.  
**1️⃣3️⃣ Tags:** Character Loops, Basic  
**1️⃣4️⃣ Time Complexity:** O(1) (fixed 26 chars)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_59
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Sum of Digits  
**5️⃣ Problem Description:** Calculate the sum of digits of a given integer. For example, sum of digits of `123` is $1+2+3=6$.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $0 \leq N \leq 10^{18}$  
**9️⃣ Sample Input:** `456`  
**🔟 Sample Output:** `15`  
**1️⃣1️⃣ Explanation:** Extract each digit using `%10` and add to a running `sum`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `0`
- **TC 2:** Input: `9` | Output: `9`
- **TC 3:** Input: `100` | Output: `1`
- **TC 4:** Input: `12345` | Output: `15`
- **TC 5:** Input: `999` | Output: `27`  
**1️⃣3️⃣ Tags:** Number Logic, Loops  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD4_60
**2️⃣ Module Name:** Loops – I  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Multiples of 5 or 7  
**5️⃣ Problem Description:** Given $N$, find the sum of all numbers between 1 and $N$ that are multiples of either 5 or 7.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer representing the sum.  
**8️⃣ Constraints:** $1 \leq N \leq 1000$  
**9️⃣ Sample Input:** `20`  
**🔟 Sample Output:** `51`  
**1️⃣1️⃣ Explanation:** Multiples are 5, 7, 10, 14, 15, 20. Sum = $5+7+10+14+15+20 = 71$. Wait, $5+7+10+14+15+20 = 71$. Let's recheck: $5, 7, 10, 14, 15, 20 \to$ Sum is 71.  
Sample input logic: $5+7+10+14+15+20 = 71$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10` | Output: `22` (5, 7, 10 $\to 22$)
- **TC 2:** Input: `5` | Output: `5`
- **TC 3:** Input: `35` | Output: `140` (5, 7, 10, 14, 15, 20, 21, 25, 28, 30, 35)
- **TC 4:** Input: `1` | Output: `0`
- **TC 5:** Input: `20` | Output: `71`  
**1️⃣3️⃣ Tags:** For Loop, If-Else, Math  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)
---

---

## MODULE 5: Loops – II (Nested loops, Number logic, Patterns)

---

### 1️⃣ Question ID: C_MOD5_61
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Right-Angled Triangle Pattern  
**5️⃣ Problem Description:** Write a program to print a right-angled triangle pattern of asterisks (`*`) for $N$ rows.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** $N$ rows of asterisks.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
*
**
***  
**1️⃣1️⃣ Explanation:** Use nested loops: the outer loop for rows and the inner loop for printing asterisks.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `*`
- **TC 2:** Input: `2` | Output: `*`, `**`
- **TC 3:** Input: `4` | Output: `*`, `**`, `***`, `****`
- **TC 4:** Input: `0` | Output: (Empty)
- **TC 5:** Input: `3` | Output as sample.  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_62
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Number Pyramid  
**5️⃣ Problem Description:** Print a number pyramid pattern for $N$ rows.
Example for $N=3$:
1
1 2
1 2 3  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** $N$ rows of numbers.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
1
1 2
1 2 3  
**1️⃣1️⃣ Explanation:** The inner loop prints values from 1 to the current row number.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2` | Output: `1`, `1 2`
- **TC 2:** Input: `5` | Output: 5 rows ending in `1 2 3 4 5`
- **TC 3:** Input: `1` | Output: `1`
- **TC 4:** Input: `3` | Output as sample.
- **TC 5:** Input: `4` | Output ending in `1 2 3 4`  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_63
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Prime Number Checker  
**5️⃣ Problem Description:** Check if a given number $N$ is Prime. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** "Prime" or "Not Prime".  
**8️⃣ Constraints:** $1 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `7`  
**🔟 Sample Output:** `Prime`  
**1️⃣1️⃣ Explanation:** Loop from 2 to $\sqrt{N}$ and check for divisibility.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `Not Prime`
- **TC 2:** Input: `2` | Output: `Prime`
- **TC 3:** Input: `4` | Output: `Not Prime`
- **TC 4:** Input: `97` | Output: `Prime`
- **TC 5:** Input: `100` | Output: `Not Prime`  
**1️⃣3️⃣ Tags:** Math, Prime Numbers, Loops  
**1️⃣4️⃣ Time Complexity:** O(sqrt(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_64
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Armstrong Number  
**5️⃣ Problem Description:** Check if a number is an Armstrong number. A 3-digit number is Armstrong if the sum of the cubes of its digits equals the number itself ($153 = 1^3 + 5^3 + 3^3$). For $N$ digits, it's the sum of digits raised to the power of $N$.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** $1 \leq N \leq 10^6$  
**9️⃣ Sample Input:** `153`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Extract digits, find their count, and calculate the sum of powers.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `370` | Output: `Yes`
- **TC 2:** Input: `371` | Output: `Yes`
- **TC 3:** Input: `407` | Output: `Yes`
- **TC 4:** Input: `123` | Output: `No`
- **TC 5:** Input: `9` | Output: `Yes` (9^1 = 9)  
**1️⃣3️⃣ Tags:** Number Logic, Armstrong, Loops  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_65
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Perfect Number Checker  
**5️⃣ Problem Description:** A perfect number is a positive integer that is equal to the sum of its positive divisors, excluding the number itself. Example: $6 (1 + 2 + 3 = 6)$. Check if $N$ is a perfect number.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** $1 \leq N \leq 10^5$  
**9️⃣ Sample Input:** `28`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Divisors of 28 are 1, 2, 4, 7, 14. $1+2+4+7+14 = 28$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `6` | Output: `Yes`
- **TC 2:** Input: `10` | Output: `No`
- **TC 3:** Input: `496` | Output: `Yes`
- **TC 4:** Input: `8128` | Output: `Yes`
- **TC 5:** Input: `1` | Output: `No`  
**1️⃣3️⃣ Tags:** Math, Divisors, Loops  
**1️⃣4️⃣ Time Complexity:** O(N) or O(sqrt(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_66
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Floyd's Triangle  
**5️⃣ Problem Description:** Print Floyd’s Triangle for $N$ rows.
Example for $N=4$:
1
2 3
4 5 6
7 8 9 10  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Floyd's triangle with space-separated numbers.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `4`  
**🔟 Sample Output:**
1
2 3
4 5 6
7 8 9 10  
**1️⃣1️⃣ Explanation:** Use a counter variable that increments every time a number is printed in the nested loop.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2` | Output: `1`, `2 3`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `3` | Output ending in `4 5 6`
- **TC 4:** Input: `5` | Output ending in `11 12 13 14 15`
- **TC 5:** Input: `4` | Output as sample.  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_67
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Inverted Pyramid  
**5️⃣ Problem Description:** Print an inverted pyramid of asterisks for $N$ rows.
Example for $N=3$:
*****
 ***
  *  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Inverted pyramid pattern.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
*****
 ***
  *  
**1️⃣1️⃣ Explanation:** Outer loop for rows, first inner loop for leading spaces, second inner loop for asterisks ($2 \times (N-i) - 1$).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `*`
- **TC 2:** Input: `2` | Output: `***`, ` * `
- **TC 4:** Input: `4` | Output starts with `*******`
- **TC 5:** Input: `3` | Output as sample.  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns, Symmetry  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_68
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Multiples in Range  
**5️⃣ Problem Description:** Print all prime numbers between two numbers $Low$ and $High$.  
**6️⃣ Input Format:** Two space-separated integers $Low$ and $High$.  
**7️⃣ Output Format:** Prime numbers separated by space.  
**8️⃣ Constraints:** $1 \leq Low \leq High \leq 1000$  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:** `11 13 17 19`  
**1️⃣1️⃣ Explanation:** Loop from $Low$ to $High$ and use the prime checker logic inside.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 10` | Output: `2 3 5 7`
- **TC 2:** Input: `20 30` | Output: `23 29`
- **TC 3:** Input: `100 110` | Output: `101 103 107 109`
- **TC 4:** Input: `14 16` | Output: (Empty)
- **TC 5:** Input: `2 3` | Output: `2 3`  
**1️⃣3️⃣ Tags:** Prime Numbers, Nested Loops  
**1️⃣4️⃣ Time Complexity:** O((High-Low) * sqrt(High))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_69
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Pascal's Triangle (Simplified)  
**5️⃣ Problem Description:** Print the first $N$ rows of Pascal's Triangle. Each number is the sum of the two numbers directly above it.
Example for $N=3$:
  1
 1 1
1 2 1  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** $N$ rows of Pascal's Triangle.  
**8️⃣ Constraints:** $1 \leq N \leq 10$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
  1
 1 1
1 2 1  
**1️⃣1️⃣ Explanation:** Use the formula $C(n, k) = C(n, k-1) \times (n-k+1) / k$ or calculate combinations.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `1`
- **TC 2:** Input: `2` | Output: `1`, `1 1`
- **TC 3:** Input: `4` | Output ending in `1 3 3 1`
- **TC 4:** Input: `5` | Output ending in `1 4 6 4 1`
- **TC 5:** Input: `10` | Max constraint reached.  
**1️⃣3️⃣ Tags:** Combinatorics, Patterns, Nested Loops  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_70
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** medium  
**4️⃣ Problem Title:** Strong Number Checker  
**5️⃣ Problem Description:** A number is called a Strong number if the sum of factorials of its digits is equal to the number itself. Example: $145 (1! + 4! + 5! = 1 + 24 + 120 = 145)$.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** $1 \leq N \leq 10^6$  
**9️⃣ Sample Input:** `145`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Extract digits, calculate factorial of each, and sum them up.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `Yes` (1! = 1)
- **TC 2:** Input: `2` | Output: `Yes` (2! = 2)
- **TC 3:** Input: `40585` | Output: `Yes`
- **TC 4:** Input: `123` | Output: `No`
- **TC 5:** Input: `10` | Output: `No`  
**1️⃣3️⃣ Tags:** Number Logic, Factorial, Loops  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_71
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Odd-Even Pyramid  
**5️⃣ Problem Description:** For $N$ rows, print 'E' if the row number is even and 'O' if the row number is odd.
Example for $N=3$:
O
EE
OOO  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Pyramid of 'O' and 'E'.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
O
EE
OOO  
**1️⃣1️⃣ Explanation:** Outer loop checks if `i % 2 == 0`, inner loop prints the chosen character `i` times.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `O`
- **TC 2:** Input: `2` | Output: `O`, `EE`
- **TC 3:** Input: `4` | Output: `O`, `EE`, `OOO`, `EEEE`
- **TC 4:** Input: `3` | Output as sample.
- **TC 5:** Input: `5` | Row 5 is `OOOOO`  
**1️⃣3️⃣ Tags:** Nested Loops, Logic, Patterns  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_72
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Binary to Decimal  
**5️⃣ Problem Description:** Input a binary number (as an integer) and convert it into its decimal equivalent.  
**6️⃣ Input Format:** A binary number $B$ (consisting of 0s and 1s).  
**7️⃣ Output Format:** A single decimal integer.  
**8️⃣ Constraints:** $0 \leq B \leq 1111111111$ (10 bits)  
**9️⃣ Sample Input:** `1011`  
**🔟 Sample Output:** `11`  
**1️⃣1️⃣ Explanation:** $1 \times 2^3 + 0 \times 2^2 + 1 \times 2^1 + 1 \times 2^0 = 8+0+2+1 = 11$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `0`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `111` | Output: `7`
- **TC 4:** Input: `1010` | Output: `10`
- **TC 5:** Input: `10000` | Output: `16`  
**1️⃣3️⃣ Tags:** Number Conversion, Binary, Loops  
**1️⃣4️⃣ Time Complexity:** O(log10(B))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_73
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Decimal to Binary  
**5️⃣ Problem Description:** Input a decimal integer and print its binary representation. (Constraint: Do not use arrays, print the bits as you find them or reverse the number).  
**Note:** A common trick is to reverse the logic or use a large multiplier.  
**6️⃣ Input Format:** A positive integer $N$.  
**7️⃣ Output Format:** Binary string.  
**8️⃣ Constraints:** $0 \leq N \leq 1023$  
**9️⃣ Sample Input:** `10`  
**🔟 Sample Output:** `1010`  
**1️⃣1️⃣ Explanation:** $10/2=5 (0), 5/2=2 (1), 2/2=1 (0), 1/2=0 (1) \to$ Reverse order: `1010`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `0`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `7` | Output: `111`
- **TC 4:** Input: `16` | Output: `10000`
- **TC 5:** Input: `100` | Output: `1100100`  
**1️⃣3️⃣ Tags:** Number Conversion, Loops  
**1️⃣4️⃣ Time Complexity:** O(log2(N))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_74
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Hollow Square Pattern  
**5️⃣ Problem Description:** Print a hollow square of asterisks for $N$ rows and columns.
Example for $N=4$:
****
*  *
*  *
****  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Hollow square pattern.  
**8️⃣ Constraints:** $1 \leq N \leq 20$  
**9️⃣ Sample Input:** `4`  
**🔟 Sample Output:**
****
*  *
*  *
****  
**1️⃣1️⃣ Explanation:** Inner loop uses `if` to check if it's the first/last row or first/last column.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `*`
- **TC 2:** Input: `2` | Output: `**`, `**`
- **TC 3:** Input: `3` | Output: `***`, `* *`, `***`
- **TC 4:** Input: `5` | 5x5 hollow square.
- **TC 5:** Input: `4` | As sample.  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns, Logic  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD5_75
**2️⃣ Module Name:** Loops – II  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Diamond Pattern  
**5️⃣ Problem Description:** Print a diamond pattern of asterisks for $2N-1$ rows.
Example for $N=3$:
  *
 ***
*****
 ***
  *  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** Diamond pattern.  
**8️⃣ Constraints:** $1 \leq N \leq 15$  
**9️⃣ Sample Input:** `3`  
**🔟 Sample Output:**
  *
 ***
*****
 ***
  *  
**1️⃣1️⃣ Explanation:** Combine a regular pyramid with an inverted pyramid.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `*`
- **TC 2:** Input: `2` | Output: ` * `, `***`, ` * `
- **TC 3:** Input: `3` | As sample.
- **TC 4:** Input: `4` | 7 rows total.
- **TC 5:** Input: `5` | 9 rows total.  
**1️⃣3️⃣ Tags:** Nested Loops, Patterns, Symmetry  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(1)
---

---

## MODULE 6: Functions & Recursion

---

### 1️⃣ Question ID: C_MOD6_76
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Area of Circle Function  
**5️⃣ Problem Description:** Write a user-defined function `float calculateArea(float radius)` that returns the area of a circle. Call this function from `main()` and print the result.  
**6️⃣ Input Format:** A float value representing the radius.  
**7️⃣ Output Format:** The area rounded to 2 decimal places.  
**8️⃣ Constraints:** $0 < Radius \leq 1000$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `78.54`  
**1️⃣1️⃣ Explanation:** Area = $3.14159 \times radius^2$. The function encapsulates the formula.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1` | Output: `3.14`
- **TC 2:** Input: `10` | Output: `314.16`
- **TC 3:** Input: `0.5` | Output: `0.79`
- **TC 4:** Input: `100` | Output: `31415.93`
- **TC 5:** Input: `5` | Output as sample.  
**1️⃣3️⃣ Tags:** Functions, Math  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_77
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Odd or Even Function  
**5️⃣ Problem Description:** Write a function `int isEven(int n)` that returns `1` if the number is even and `0` if it is odd. Use this function in `main()` to print "Even" or "Odd".  
**6️⃣ Input Format:** A single integer.  
**7️⃣ Output Format:** "Even" or "Odd".  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `7`  
**🔟 Sample Output:** `Odd`  
**1️⃣1️⃣ Explanation:** Logic: `return (n % 2 == 0);`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10` | Output: `Even`
- **TC 2:** Input: `0` | Output: `Even`
- **TC 3:** Input: `-5` | Output: `Odd`
- **TC 4:** Input: `100` | Output: `Even`
- **TC 5:** Input: `1` | Output: `Odd`  
**1️⃣3️⃣ Tags:** Functions, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_78
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Swap by Value  
**5️⃣ Problem Description:** Write a function `void swap(int a, int b)` that attempts to swap two numbers. In `main()`, print the values before and after calling the function. Explain whether the values in `main()` actually change.  
**6️⃣ Input Format:** Two space-separated integers $X$ and $Y$.  
**7️⃣ Output Format:**
Before: [X] [Y]
After: [X] [Y]  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:**
Before: 10 20
After: 10 20  
**1️⃣1️⃣ Explanation:** In C, parameters are passed by value. Changes made to parameters inside a function do not affect the original variables in `main()`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5 5` | Output: `Before: 5 5`, `After: 5 5`
- **TC 2:** Input: `1 2` | Output: `Before: 1 2`, `After: 1 2`
- **TC 3:** Input: `-10 10` | Output: `Before: -10 10`, `After: -10 10`
- **TC 4:** Input: `0 0` | Output: `Before: 0 0`, `After: 0 0`
- **TC 5:** Input: `10 20` | As sample.  
**1️⃣3️⃣ Tags:** Call by Value, Functions, Scope  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_79
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Power Function (Recursion)  
**5️⃣ Problem Description:** Write a recursive function `int power(int base, int exp)` to calculate $base^{exp}$.  
**6️⃣ Input Format:** Two integers $B$ and $E$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq B \leq 10, 0 \leq E \leq 10$  
**9️⃣ Sample Input:** `2 5`  
**🔟 Sample Output:** `32`  
**1️⃣1️⃣ Explanation:** Base case: `if (exp == 0) return 1;`. Recursive step: `return base * power(base, exp - 1);`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5 0` | Output: `1`
- **TC 2:** Input: `3 3` | Output: `27`
- **TC 3:** Input: `10 2` | Output: `100`
- **TC 4:** Input: `1 10` | Output: `1`
- **TC 5:** Input: `2 5` | As sample.  
**1️⃣3️⃣ Tags:** Recursion, Math  
**1️⃣4️⃣ Time Complexity:** O(E)  
**1️⃣5️⃣ Space Complexity:** O(E) (recursion stack)

---

### 1️⃣ Question ID: C_MOD6_80
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Factorial (Recursion)  
**5️⃣ Problem Description:** Write a recursive function `long long factorial(int n)` to find the factorial of $N$.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $0 \leq N \leq 20$  
**9️⃣ Sample Input:** `5`  
**🔟 Sample Output:** `120`  
**1️⃣1️⃣ Explanation:** $fact(n) = n \times fact(n-1)$; $fact(0) = 1$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `1`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `6` | Output: `720`
- **TC 4:** Input: `10` | Output: `3628800`
- **TC 5:** Input: `20` | Output: `2432902008176640000`  
**1️⃣3️⃣ Tags:** Recursion, Factorial, Math  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD6_81
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Fibonacci Term (Recursion)  
**5️⃣ Problem Description:** Find the $N^{th}$ Fibonacci number using recursion (0-indexed: $F(0)=0, F(1)=1, \dots$).  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** $N^{th}$ Fibonacci number.  
**8️⃣ Constraints:** $0 \leq N \leq 25$  
**9️⃣ Sample Input:** `6`  
**🔟 Sample Output:** `8`  
**1️⃣1️⃣ Explanation:** $F(n) = F(n-1) + F(n-2)$ with base cases $F(0)=0, F(1)=1$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `0`
- **TC 2:** Input: `1` | Output: `1`
- **TC 3:** Input: `2` | Output: `1`
- **TC 4:** Input: `10` | Output: `55`
- **TC 5:** Input: `25` | Output: `75025`  
**1️⃣3️⃣ Tags:** Recursion, Fibonacci  
**1️⃣4️⃣ Time Complexity:** O(2^N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD6_82
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Prime Checker Function  
**5️⃣ Problem Description:** Create a function `void printPrimes(int start, int end)` that prints all prime numbers in the given range.  
**6️⃣ Input Format:** Two space-separated integers $start$ and $end$.  
**7️⃣ Output Format:** Prime numbers separated by space.  
**8️⃣ Constraints:** $1 \leq start \leq end \leq 500$  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:** `11 13 17 19`  
**1️⃣1️⃣ Explanation:** Modularize the prime checking logic into its own function.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 5` | Output: `2 3 5`
- **TC 2:** Input: `50 60` | Output: `53 59`
- **TC 3:** Input: `100 110` | Output: `101 103 107 109`
- **TC 4:** Input: `20 20` | Output: (Empty)
- **TC 5:** Input: `2 3` | Output: `2 3`  
**1️⃣3️⃣ Tags:** Functions, Nested Loops, Prime  
**1️⃣4️⃣ Time Complexity:** O((end-start) * sqrt(end))  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_83
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Sum of Digits (Recursion)  
**5️⃣ Problem Description:** Write a recursive function `int sumOfDigits(int n)` that returns the sum of digits of $N$.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $0 \leq N \leq 10^9$  
**9️⃣ Sample Input:** `1234`  
**🔟 Sample Output:** `10`  
**1️⃣1️⃣ Explanation:** `sumOfDigits(n) = (n % 10) + sumOfDigits(n / 10)`. Base case: `n == 0`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `0` | Output: `0`
- **TC 2:** Input: `7` | Output: `7`
- **TC 3:** Input: `999` | Output: `27`
- **TC 4:** Input: `1010` | Output: `2`
- **TC 5:** Input: `12345` | Output: `15`  
**1️⃣3️⃣ Tags:** Recursion, Math  
**1️⃣4️⃣ Time Complexity:** O(log10(N))  
**1️⃣5️⃣ Space Complexity:** O(log10(N))

---

### 1️⃣ Question ID: C_MOD6_84
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Celsius Converter Function  
**5️⃣ Problem Description:** Create a function `float toFahrenheit(float c)` and another `float toCelsius(float f)`. Use them to convert a given choice.  
**6️⃣ Input Format:** Choice (1 for C to F, 2 for F to C) and the temperature value.  
**7️⃣ Output Format:** Converted value rounded to 2 decimal places.  
**8️⃣ Constraints:** Standard temperature range.  
**9️⃣ Sample Input:** `1 37`  
**🔟 Sample Output:** `98.60`  
**1️⃣1️⃣ Explanation:** choice 1 calls `toFahrenheit`, choice 2 calls `toCelsius`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 0` | Output: `32.00`
- **TC 2:** Input: `2 212` | Output: `100.00`
- **TC 3:** Input: `2 32` | Output: `0.00`
- **TC 4:** Input: `1 100` | Output: `212.00`
- **TC 5:** Input: `2 -40` | Output: `-40.00`  
**1️⃣3️⃣ Tags:** Functions, Conversion, Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_85
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Multi-file Prototype  
**5️⃣ Problem Description:** Explain the importance of a **Function Prototype** in C. Write a program where a function definition appears AFTER `main()`, but it is called INSIDE `main()`. Use a prototype to fix the compiler error.  
**Note:** The user should implement a simple function like `int multiply(int a, int b)`.  
**6️⃣ Input Format:** Two integers $A, B$.  
**7️⃣ Output Format:** Their product.  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `4 5`  
**🔟 Sample Output:** `20`  
**1️⃣1️⃣ Explanation:** Prototypes tell the compiler the function's signature before its actual implementation is encountered.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 0` | Output: `0`
- **TC 2:** Input: `-2 3` | Output: `-6`
- **TC 3:** Input: `1 1` | Output: `1`
- **TC 4:** Input: `100 100` | Output: `10000`
- **TC 5:** Input: `4 5` | As sample.  
**1️⃣3️⃣ Tags:** Functions, Compilation, Prototypes  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_86
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** GCD using Recursion  
**5️⃣ Problem Description:** Write a recursive function `int gcd(int a, int b)` based on the Euclidean algorithm: `gcd(a, b) = gcd(b, a % b)` with base case `b == 0`.  
**6️⃣ Input Format:** Two space-separated integers.  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq A, B \leq 10^9$  
**9️⃣ Sample Input:** `48 18`  
**🔟 Sample Output:** `6`  
**1️⃣1️⃣ Explanation:** Recursive execution: `gcd(48,18) -> gcd(18,12) -> gcd(12,6) -> gcd(6,0) -> 6`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 5` | Output: `5`
- **TC 2:** Input: `7 13` | Output: `1`
- **TC 3:** Input: `100 25` | Output: `25`
- **TC 4:** Input: `12 18` | Output: `6`
- **TC 5:** Input: `1 1` | Output: `1`  
**1️⃣3️⃣ Tags:** Recursion, Math, GCD  
**1️⃣4️⃣ Time Complexity:** O(log(min(A,B)))  
**1️⃣5️⃣ Space Complexity:** O(log(min(A,B)))

---

### 1️⃣ Question ID: C_MOD6_87
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Reverse String (Recursion)  
**5️⃣ Problem Description:** Write a recursive function that takes a string (as a char array) and prints it in reverse. (Constraint: Do not use `strrev()` or iterative loops).  
**Note:** Use recursion to print the last character, then the rest.  
**6️⃣ Input Format:** A single string (no spaces).  
**7️⃣ Output Format:** Reversed string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `abcde`  
**🔟 Sample Output:** `edcba`  
**1️⃣1️⃣ Explanation:** Recursive call `reverse(str + 1)` and then print `str[0]`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `hello` | Output: `olleh`
- **TC 2:** Input: `a` | Output: `a`
- **TC 3:** Input: `12345` | Output: `54321`
- **TC 4:** Input: `racecar` | Output: `racecar`
- **TC 5:** Input: `CProg` | Output: `gorPC`  
**1️⃣3️⃣ Tags:** Recursion, Strings  
**1️⃣4️⃣ Time Complexity:** O(Length)  
**1️⃣5️⃣ Space Complexity:** O(Length)

---

### 1️⃣ Question ID: C_MOD6_88
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Static Variable Demo  
**5️⃣ Problem Description:** Demonstrate the use of `static` variables inside a function. Create a function `void incrementAndPrint()` that increments a static variable and prints its value. Call it three times from `main()`.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:**
Call 1: 1
Call 2: 2
Call 3: 3  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** As above.  
**1️⃣1️⃣ Explanation:** Static variables retain their value between function calls.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Output contains `Call 1: 1`, `Call 2: 2`, `Call 3: 3`.  
**1️⃣3️⃣ Tags:** Functions, Storage Classes, Static  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD6_89
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Binary Search (Recursive)  
**5️⃣ Problem Description:** Write a recursive function `int binarySearch(int arr[], int low, int high, int key)`. (Assume the array is already sorted). If found, return the index; else return `-1`.  
**Note:** Since we haven't officially covered arrays deeply yet, the user can assume a fixed sorted array in `main()`.  
**6️⃣ Input Format:** Size of array, sorted elements, and the search key.  
**7️⃣ Output Format:** Index or `-1`.  
**8️⃣ Constraints:** Size $\leq 100$  
**9️⃣ Sample Input:**
`5`
`10 20 30 40 50`
`30`  
**🔟 Sample Output:** `2`  
**1️⃣1️⃣ Explanation:** Compare key with middle element, then recurse left or right.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5`, `1 2 3 4 5`, `1` | Output: `0`
- **TC 2:** Input: `5`, `1 2 3 4 5`, `5` | Output: `4`
- **TC 3:** Input: `5`, `1 2 3 4 5`, `10` | Output: `-1`
- **TC 4:** Input: `3`, `10 20 30`, `20` | Output: `1`
- **TC 5:** Input: `3`, `10 20 30`, `15` | Output: `-1`  
**1️⃣3️⃣ Tags:** Recursion, Binary Search, Algorithms  
**1️⃣4️⃣ Time Complexity:** O(log N)  
**1️⃣5️⃣ Space Complexity:** O(log N)

---

### 1️⃣ Question ID: C_MOD6_90
**2️⃣ Module Name:** Functions & Recursion  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Decimal to Hexadecimal (Recursion)  
**5️⃣ Problem Description:** Convert a decimal number to its hexadecimal equivalent using a recursive function.  
**6️⃣ Input Format:** A positive integer $N$.  
**7️⃣ Output Format:** Hexadecimal string (Uppercase).  
**8️⃣ Constraints:** $0 \leq N \leq 10^6$  
**9️⃣ Sample Input:** `255`  
**🔟 Sample Output:** `FF`  
**1️⃣1️⃣ Explanation:** Recurse `N/16` and then print the remainder as a hex digit (0-9, A-F).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10` | Output: `A`
- **TC 2:** Input: `16` | Output: `10`
- **TC 3:** Input: `4096` | Output: `1000`
- **TC 4:** Input: `0` | Output: `0`
- **TC 5:** Input: `31` | Output: `1F`  
**1️⃣3️⃣ Tags:** Recursion, Number Conversion, Hex  
**1️⃣4️⃣ Time Complexity:** O(log16(N))  
**1️⃣5️⃣ Space Complexity:** O(log16(N))
---

---

## MODULE 7: Arrays (1D)

---

### 1️⃣ Question ID: C_MOD7_91
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Array Traversal  
**5️⃣ Problem Description:** Input $N$ integers into an array and print all elements in the same order separated by space.  
**6️⃣ Input Format:**
- An integer $N$ (size of array).
- $N$ space-separated integers.  
**7️⃣ Output Format:** $N$ integers separated by space.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`10 20 30 40 50`  
**🔟 Sample Output:** `10 20 30 40 50`  
**1️⃣1️⃣ Explanation:** Use a loop to read $N$ elements into an array and another loop to print them.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `5` | Output: `5`
- **TC 2:** Input: `3`, `1 2 3` | Output: `1 2 3`
- **TC 3:** Input: `5`, `0 0 0 0 0` | Output: `0 0 0 0 0`
- **TC 4:** Input: `2`, `-5 5` | Output: `-5 5`
- **TC 5:** Input: `5`, `10 20 30 40 50` | As sample.  
**1️⃣3️⃣ Tags:** Arrays, Traversal, Basic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_92
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Sum and Average of Array  
**5️⃣ Problem Description:** Find the sum and average of all elements in a 1D array of size $N$.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:**
Sum: [S]
Average: [A] (2 decimal places)  
**8️⃣ Constraints:** $1 \leq N \leq 100$, each element $\leq 1000$.  
**9️⃣ Sample Input:**
`4`
`1 2 3 4`  
**🔟 Sample Output:**
Sum: 10
Average: 2.50  
**1️⃣1️⃣ Explanation:** Iterate through the array, add elements to a `sum` variable, then divide by $N.0$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `10` | Output: `Sum: 10`, `Average: 10.00`
- **TC 2:** Input: `3`, `5 5 5` | Output: `Sum: 15`, `Average: 5.00`
- **TC 3:** Input: `5`, `1 1 1 1 1` | Output: `Sum: 5`, `Average: 1.00`
- **TC 4:** Input: `2`, `10 20` | Output: `Sum: 30`, `Average: 15.00`
- **TC 5:** Input: `4`, `1 2 3 4` | As sample.  
**1️⃣3️⃣ Tags:** Arrays, Math, Average  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_93
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Maximum and Minimum in Array  
**5️⃣ Problem Description:** Find the largest and smallest elements in a 1D array.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:**
Largest: [L]
Smallest: [S]  
**8️⃣ Constraints:** $1 \leq N \leq 1000$  
**9️⃣ Sample Input:**
`6`
`5 10 3 15 2 8`  
**🔟 Sample Output:**
Largest: 15
Smallest: 2  
**1️⃣1️⃣ Explanation:** Initialize `max = arr[0]` and `min = arr[0]`, then compare with other elements in a loop.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `100` | Output: `Largest: 100`, `Smallest: 100`
- **TC 2:** Input: `3`, `-5 0 5` | Output: `Largest: 5`, `Smallest: -5`
- **TC 3:** Input: `5`, `10 10 10 10 10` | Output: `Largest: 10`, `Smallest: 10`
- **TC 4:** Input: `4`, `9 8 7 6` | Output: `Largest: 9`, `Smallest: 6`
- **TC 5:** Input: `2`, `256 1024` | Output: `Largest: 1024`, `Smallest: 256`  
**1️⃣3️⃣ Tags:** Arrays, Min-Max, Comparison  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_94
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Reverse an Array  
**5️⃣ Problem Description:** Write a program to reverse the elements of a 1D array in-place. (Constraint: Do not use another array).  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:** Reversed array elements separated by space.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`1 2 3 4 5`  
**🔟 Sample Output:** `5 4 3 2 1`  
**1️⃣1️⃣ Explanation:** Use two pointers (start and end) and swap them until they meet in the middle.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `10` | Output: `10`
- **TC 2:** Input: `2`, `20 30` | Output: `30 20`
- **TC 3:** Input: `4`, `1 2 1 2` | Output: `2 1 2 1`
- **TC 4:** Input: `6`, `10 20 30 40 50 60` | Output: `60 50 40 30 20 10`
- **TC 5:** Input: `3`, `100 0 -100` | Output: `-100 0 100`  
**1️⃣3️⃣ Tags:** Arrays, Swapping, In-place  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N) (Input storage)

---

### 1️⃣ Question ID: C_MOD7_95
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Search an Element  
**5️⃣ Problem Description:** Input $N$ integers and a "Key". Find if the key exists in the array and print its first occurrence index (0-indexed). If not found, print "-1".  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers
- Key to find  
**7️⃣ Output Format:** Index or -1.  
**8️⃣ Constraints:** $1 \leq N \leq 500$  
**9️⃣ Sample Input:**
`5`
`12 5 7 10 3`
`7`  
**🔟 Sample Output:** `2`  
**1️⃣1️⃣ Explanation:** Linear search through the array.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `3`, `1 2 3`, `2` | Output: `1`
- **TC 2:** Input: `5`, `10 20 30 40 50`, `60` | Output: `-1`
- **TC 3:** Input: `1`, `10`, `10` | Output: `0`
- **TC 4:** Input: `4`, `5 5 5 5`, `5` | Output: `0`
- **TC 5:** Input: `2`, `10 20`, `20` | Output: `1`  
**1️⃣3️⃣ Tags:** Arrays, Searching, Linear Search  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_96
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Second Largest Element  
**5️⃣ Problem Description:** Find the second largest element in a 1D array of size $N$.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $2 \leq N \leq 1000$, all elements distinctive.  
**9️⃣ Sample Input:**
`5`
`10 20 4 45 99`  
**🔟 Sample Output:** `45`  
**1️⃣1️⃣ Explanation:** Keep track of `largest` and `second_largest` as you iterate through the array.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2`, `10 20` | Output: `10`
- **TC 2:** Input: `3`, `1 2 3` | Output: `2`
- **TC 3:** Input: `5`, `10 5 8 12 11` | Output: `11`
- **TC 4:** Input: `4`, `-1 -5 -2 -10` | Output: `-2`
- **TC 5:** Input: `5`, `10 20 4 45 99` | As sample.  
**1️⃣3️⃣ Tags:** Arrays, Logic, Optimization  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_97
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Count Even and Odd elements  
**5️⃣ Problem Description:** Count how many even and odd numbers are present in a 1D array.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:**
Even: [E]
Odd: [O]  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`1 2 3 4 5`  
**🔟 Sample Output:**
Even: 2
Odd: 3  
**1️⃣1️⃣ Explanation:** Check each element with `% 2` and increment respective counters.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `0` | Output: `Even: 1`, `Odd: 0`
- **TC 2:** Input: `2`, `1 3` | Output: `Even: 0`, `Odd: 2`
- **TC 3:** Input: `4`, `2 4 6 8` | Output: `Even: 4`, `Odd: 0`
- **TC 4:** Input: `3`, `10 11 12` | Output: `Even: 2`, `Odd: 1`
- **TC 5:** Input: `0` (Wait, $N \geq 1$) -> Input: `1`, `1` | Output: `Even: 0`, `Odd: 1`  
**1️⃣3️⃣ Tags:** Arrays, Logic, Counting  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_98
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Copy Array  
**5️⃣ Problem Description:** Input an array $A$ and copy its elements into another array $B$ in reverse order. Print array $B$.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers for array $A$  
**7️⃣ Output Format:** Array $B$ elements.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`3`
`10 20 30`  
**🔟 Sample Output:** `30 20 10`  
**1️⃣1️⃣ Explanation:** Loop through $A$ from end to start and assign to $B$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `5` | Output: `5`
- **TC 2:** Input: `2`, `1 2` | Output: `2 1`
- **TC 3:** Input: `5`, `1 1 1 1 1` | Output: `1 1 1 1 1`
- **TC 4:** Input: `3`, `-1 0 1` | Output: `1 0 -1`
- **TC 5:** Input: `4`, `10 20 30 40` | Output: `40 30 20 10`  
**1️⃣3️⃣ Tags:** Arrays, Copying  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_99
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Delete an Element  
**5️⃣ Problem Description:** Given an array of size $N$, delete the element at a specific index $K$ (0-indexed) and print the resulting array.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers
- index $K$  
**7️⃣ Output Format:** $N-1$ integers.  
**8️⃣ Constraints:** $1 \leq N \leq 100, 0 \leq K < N$  
**9️⃣ Sample Input:**
`5`
`10 20 30 40 50`
`2`  
**🔟 Sample Output:** `10 20 40 50`  
**1️⃣1️⃣ Explanation:** Shift elements from $K+1$ onwards one position to the left.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `3`, `1 2 3`, `0` | Output: `2 3`
- **TC 2:** Input: `3`, `1 2 3`, `2` | Output: `1 2`
- **TC 3:** Input: `1`, `10`, `0` | Output: (Empty)
- **TC 4:** Input: `5`, `1 2 3 4 5`, `1` | Output: `1 3 4 5`
- **TC 5:** Input: `2`, `10 20`, `0` | Output: `20`  
**1️⃣3️⃣ Tags:** Arrays, Deletion, Shifting  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_100
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Merge Two Arrays  
**5️⃣ Problem Description:** Input two arrays of size $N1$ and $N2$. Merge them into a third array and print the merged array.  
**6️⃣ Input Format:**
- $N1$, then $N1$ elements
- $N2$, then $N2$ elements  
**7️⃣ Output Format:** $N1+N2$ elements.  
**8️⃣ Constraints:** $1 \leq N1, N2 \leq 50$  
**9️⃣ Sample Input:**
`2 10 20`
`3 30 40 50`  
**🔟 Sample Output:** `10 20 30 40 50`  
**1️⃣1️⃣ Explanation:** Copy first array into the third, then append the second array.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 5`, `1 10` | Output: `5 10`
- **TC 2:** Input: `3 1 2 3`, `0` (Wait $N \geq 1$) -> `3 1 2 3`, `1 4` | Output: `1 2 3 4`
- **TC 3:** Input: `2 1 1`, `2 1 1` | Output: `1 1 1 1`
- **TC 4:** Input: `1 100`, `1 -100` | Output: `100 -100`
- **TC 5:** Input: `4 1 2 3 4`, `2 5 6` | Output: `1 2 3 4 5 6`  
**1️⃣3️⃣ Tags:** Arrays, Merging  
**1️⃣4️⃣ Time Complexity:** O(N1+N2)  
**1️⃣5️⃣ Space Complexity:** O(N1+N2)

---

### 1️⃣ Question ID: C_MOD7_101
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Unique Elements  
**5️⃣ Problem Description:** Input an array and print all those elements that appear exactly once.  
**6️⃣ Input Format:**
- Integer $N$
- $N$ integers  
**7️⃣ Output Format:** Unique integers separated by space.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`6`
`1 2 1 3 2 4`  
**🔟 Sample Output:** `3 4`  
**1️⃣1️⃣ Explanation:** Use nested loops: for each element, check its frequency across the array.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `3`, `1 1 1` | Output: (Empty)
- **TC 2:** Input: `3`, `1 2 3` | Output: `1 2 3`
- **TC 3:** Input: `4`, `10 20 10 30` | Output: `20 30`
- **TC 4:** Input: `1`, `5` | Output: `5`
- **TC 5:** Input: `5`, `1 2 1 2 3` | Output: `3`  
**1️⃣3️⃣ Tags:** Arrays, Frequency, Logic  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_102
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Array Frequency  
**5️⃣ Problem Description:** Count the frequency of a specific element $X$ in an array of size $N$.  
**6️⃣ Input Format:**
- $N$
- array elements
- $X$ (number to search)  
**7️⃣ Output Format:** Frequency of $X$.  
**8️⃣ Constraints:** $1 \leq N \leq 1000$  
**9️⃣ Sample Input:**
`5`
`1 2 2 3 2`
`2`  
**🔟 Sample Output:** `3`  
**1️⃣1️⃣ Explanation:** Simple loop with an `if` condition and a counter.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5`, `1 1 1 1 1`, `1` | Output: `5`
- **TC 2:** Input: `5`, `1 2 3 4 5`, `10` | Output: `0`
- **TC 3:** Input: `1`, `5`, `5` | Output: `1`
- **TC 4:** Input: `4`, `10 20 10 20`, `20` | Output: `2`
- **TC 5:** Input: `6`, `1 2 1 2 1 2`, `1` | Output: `3`  
**1️⃣3️⃣ Tags:** Arrays, Counting  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_103
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** medium  
**4️⃣ Problem Title:** Left Rotate Array  
**5️⃣ Problem Description:** Rotate an array to the left by one position. Example: `[1, 2, 3]` becomes `[2, 3, 1]`.  
**6️⃣ Input Format:**
- $N$
- $N$ integers  
**7️⃣ Output Format:** Rotated array.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`3`
`10 20 30`  
**🔟 Sample Output:** `20 30 10`  
**1️⃣1️⃣ Explanation:** Store the first element, shift rest to left, put first element at the end.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `5` | Output: `5`
- **TC 2:** Input: `2`, `1 2` | Output: `2 1`
- **TC 3:** Input: `4`, `1 2 3 4` | Output: `2 3 4 1`
- **TC 4:** Input: `5`, `10 10 20 20 30` | Output: `10 20 20 30 10`
- **TC 5:** Input: `3`, `100 200 300` | Output: `200 300 100`  
**1️⃣3️⃣ Tags:** Arrays, Rotation, Shifting  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_104
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** medium  
**4️⃣ Problem Title:** Split Even and Odd  
**5️⃣ Problem Description:** Given an array, store all even numbers in a new array `even[]` and all odd numbers in `odd[]`. Print both arrays.  
**6️⃣ Input Format:**
- $N$
- $N$ integers  
**7️⃣ Output Format:**
Even: [elements]
Odd: [elements]  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`4`
`10 15 20 25`  
**🔟 Sample Output:**
Even: 10 20
Odd: 15 25  
**1️⃣1️⃣ Explanation:** Use separate arrays and counters for even and odd elements.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2`, `1 2` | Output: `Even: 2`, `Odd: 1`
- **TC 2:** Input: `3`, `1 3 5` | Output: `Even: `, `Odd: 1 3 5`
- **TC 3:** Input: `2`, `10 12` | Output: `Even: 10 12`, `Odd: `
- **TC 4:** Input: `1`, `0` | Output: `Even: 0`, `Odd: `
- **TC 5:** Input: `5`, `1 2 3 4 5` | Output: `Even: 2 4`, `Odd: 1 3 5`  
**1️⃣3️⃣ Tags:** Arrays, Conditional Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD7_105
**2️⃣ Module Name:** Arrays (1D)  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Array Symmetry  
**5️⃣ Problem Description:** An array is symmetric if it reads the same forward and backward (like a palindrome). Check if the input array is symmetric.  
**6️⃣ Input Format:**
- $N$
- $N$ integers  
**7️⃣ Output Format:** "Symmetric" or "Not Symmetric".  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`3`
`10 20 10`  
**🔟 Sample Output:** `Symmetric`  
**1️⃣1️⃣ Explanation:** Compare `arr[i]` with `arr[N-1-i]` for all $i$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `100` | Output: `Symmetric`
- **TC 2:** Input: `2`, `10 20` | Output: `Not Symmetric`
- **TC 3:** Input: `4`, `1 2 2 1` | Output: `Symmetric`
- **TC 4:** Input: `5`, `1 2 3 2 1` | Output: `Symmetric`
- **TC 5:** Input: `4`, `1 2 3 4` | Output: `Not Symmetric`  
**1️⃣3️⃣ Tags:** Arrays, Palindrome, Symmetry  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)
---

---

## MODULE 8: Arrays (2D), Searching & Sorting

---

### 1️⃣ Question ID: C_MOD8_106
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Matrix Traversal  
**5️⃣ Problem Description:** Input a 2D array (matrix) of size $R \times C$ and print the elements in matrix form.  
**6️⃣ Input Format:**
- $R$ and $C$ (rows and columns).
- $R \times C$ integers.  
**7️⃣ Output Format:** Matrix with elements separated by space in each row.  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 3`
`1 2 3`
`4 5 6`  
**🔟 Sample Output:**
1 2 3
4 5 6  
**1️⃣1️⃣ Explanation:** Use nested loops: outer for rows ($i$) and inner for columns ($j$).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `5` | Output: `5`
- **TC 2:** Input: `2 2`, `1 0 0 1` | Output: `1 0`, `0 1`
- **TC 3:** Input: `3 1`, `10 20 30` | Output: `10`, `20`, `30`
- **TC 4:** Input: `3 3`, `1 1 1 2 2 2 3 3 3` | Output: 3x3 matrix.
- **TC 5:** Input: `2 3`, `1 2 3 4 5 6` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix, Traversal  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_107
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Sum of Matrix Elements  
**5️⃣ Problem Description:** Write a program to find the sum of all elements in a 2D array of size $R \times C$.  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq R, C \leq 20$  
**9️⃣ Sample Input:**
`2 2`
`10 10`
`10 10`  
**🔟 Sample Output:** `40`  
**1️⃣1️⃣ Explanation:** Iterate through all elements using nested loops and add them to a `sum`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `100` | Output: `100`
- **TC 2:** Input: `2 3`, `1 1 1 1 1 1` | Output: `6`
- **TC 3:** Input: `3 3`, `1 2 3 4 5 6 7 8 9` | Output: `45`
- **TC 4:** Input: `2 2`, `0 0 0 0` | Output: `0`
- **TC 5:** Input: `2 2`, `10 10 10 10` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Math  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_108
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Matrix Addition  
**5️⃣ Problem Description:** Input two matrices of the same size $R \times C$ and print their sum.  
**6️⃣ Input Format:**
- $R, C$
- Matrix 1 elements
- Matrix 2 elements  
**7️⃣ Output Format:** Resulting matrix.  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 2`
`1 2 3 4`
`5 6 7 8`  
**🔟 Sample Output:**
6 8
10 12  
**1️⃣1️⃣ Explanation:** $C[i][j] = A[i][j] + B[i][j]$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `5`, `10` | Output: `15`
- **TC 2:** Input: `2 2`, `0 0 0 0`, `1 1 1 1` | Output: `1 1`, `1 1`
- **TC 3:** Input: `2 2`, `1 -1 -1 1`, `-1 1 1 -1` | Output: `0 0`, `0 0`
- **TC 4:** Input: `2 3`, `1 1 1 1 1 1`, `2 2 2 2 2 2` | Output: `3 3 3`, `3 3 3`
- **TC 5:** Input: `2 2`, `1 2 3 4`, `5 6 7 8` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix Addition  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_109
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Row-wise Sum  
**5️⃣ Problem Description:** For a given $R \times C$ matrix, print the sum of each row.  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements  
**7️⃣ Output Format:** Sums separated by space or newline.  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 3`
`1 2 3`
`4 5 6`  
**🔟 Sample Output:** `6 15`  
**1️⃣1️⃣ Explanation:** For each row, reset a `rowSum` counter and iterate columns.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 3`, `1 2 3` | Output: `6`
- **TC 2:** Input: `3 1`, `10 20 30` | Output: `10 20 30`
- **TC 3:** Input: `2 2`, `1 1 2 2` | Output: `2 4`
- **TC 4:** Input: `3 3`, `1 1 1 1 1 1 1 1 1` | Output: `3 3 3`
- **TC 5:** Input: `2 3`, `1 2 3 4 5 6` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Logic  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_110
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Transpose of a Matrix  
**5️⃣ Problem Description:** Input an $R \times C$ matrix and output its transpose ($C \times R$ matrix).  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements  
**7️⃣ Output Format:** Transposed matrix.  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 3`
`1 2 3`
`4 5 6`  
**🔟 Sample Output:**
1 4
2 5
3 6  
**1️⃣1️⃣ Explanation:** In transpose, $B[j][i] = A[i][j]$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `10` | Output: `10`
- **TC 2:** Input: `2 2`, `1 2 3 4` | Output: `1 3`, `2 4`
- **TC 3:** Input: `3 1`, `1 2 3` | Output: `1 2 3` (Row vector)
- **TC 4:** Input: `1 3`, `1 2 3` | Output: `1`, `2`, `3` (Column vector)
- **TC 5:** Input: `2 3`, `1 2 3 4 5 6` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix Transpose  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_111
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Diagonal Sum  
**5️⃣ Problem Description:** Find the sum of the main diagonal elements of a square matrix ($N \times N$).  
**6️⃣ Input Format:**
- $N$
- $N \times N$ matrix elements  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** $1 \leq N \leq 10$  
**9️⃣ Sample Input:**
`3`
`1 2 3`
`4 5 6`
`7 8 9`  
**🔟 Sample Output:** `15`  
**1️⃣1️⃣ Explanation:** Add elements $A[i][i]$ for $i = 0 \dots N-1$. Sum = $1+5+9=15$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `100` | Output: `100`
- **TC 2:** Input: `2`, `1 2 3 4` | Output: `5`
- **TC 3:** Input: `3`, `1 0 0 0 1 0 0 0 1` | Output: `3` (Identity matrix)
- **TC 4:** Input: `4`, `1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1` | Output: `4`
- **TC 5:** Input: `3`, `1 2 3 4 5 6 7 8 9` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Diagonal, Math  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N^2)

---

### 1️⃣ Question ID: C_MOD8_112
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Bubble Sort  
**5️⃣ Problem Description:** Input an array of size $N$ and sort it in ascending order using the Bubble Sort algorithm.  
**6️⃣ Input Format:**
- $N$
- Array elements  
**7️⃣ Output Format:** Sorted array space-separated.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`5 1 4 2 8`  
**🔟 Sample Output:** `1 2 4 5 8`  
**1️⃣1️⃣ Explanation:** Repeatedly swap adjacent elements if they are in the wrong order.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `10` | Output: `10`
- **TC 2:** Input: `3`, `3 2 1` | Output: `1 2 3`
- **TC 3:** Input: `4`, `1 2 3 4` | Output: `1 2 3 4`
- **TC 4:** Input: `5`, `10 -5 0 20 8` | Output: `-5 0 8 10 20`
- **TC 5:** Input: `5`, `5 1 4 2 8` | As sample.  
**1️⃣3️⃣ Tags:** Sorting, Bubble Sort, Algorithms  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD8_113
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Selection Sort  
**5️⃣ Problem Description:** Sort an array of size $N$ in ascending order using Selection Sort.  
**6️⃣ Input Format:**
- $N$
- Array elements  
**7️⃣ Output Format:** Sorted array.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`64 25 12 22 11`  
**🔟 Sample Output:** `11 12 22 25 64`  
**1️⃣1️⃣ Explanation:** Find the minimum element in the unsorted part and put it at the beginning.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2`, `2 1` | Output: `1 2`
- **TC 2:** Input: `5`, `10 20 30 40 50` | Output: `10 20 30 40 50`
- **TC 3:** Input: `4`, `-1 -10 5 0` | Output: `-10 -1 0 5`
- **TC 4:** Input: `3`, `1 1 1` | Output: `1 1 1`
- **TC 5:** Input: `5`, `64 25 12 22 11` | As sample.  
**1️⃣3️⃣ Tags:** Sorting, Selection Sort, Algorithms  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD8_114
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Linear Search in Matrix  
**5️⃣ Problem Description:** Search for a key in an $R \times C$ matrix. If found, print its position (Row, Col); else print "-1".  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements
- Key  
**7️⃣ Output Format:** `Row: [r], Col: [c]` or `-1`.  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 2`
`10 20`
`30 40`
`30`  
**🔟 Sample Output:** `Row: 1, Col: 0`  
**1️⃣1️⃣ Explanation:** Nested loop search.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2 2`, `1 2 3 4`, `1` | Output: `Row: 0, Col: 0`
- **TC 2:** Input: `2 2`, `1 2 3 4`, `5` | Output: `-1`
- **TC 3:** Input: `1 3`, `10 20 30`, `30` | Output: `Row: 0, Col: 2`
- **TC 4:** Input: `3 1`, `5 10 15`, `10` | Output: `Row: 1, Col: 0`
- **TC 5:** Input: `2 2`, `10 20 30 40`, `30` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Searching  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_115
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Binary Search (Iterative)  
**5️⃣ Problem Description:** Implement Binary Search iteratively on a sorted array. If the key exists, return its index; otherwise, return `-1`.  
**6️⃣ Input Format:**
- $N$ (size)
- $N$ sorted integers
- Key  
**7️⃣ Output Format:** Index or -1.  
**8️⃣ Constraints:** $1 \leq N \leq 1000$  
**9️⃣ Sample Input:**
`6`
`2 4 6 8 10 12`
`10`  
**🔟 Sample Output:** `4`  
**1️⃣1️⃣ Explanation:** Use `low`, `high`, and `mid` pointers. Update `low` or `high` based on comparison.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5`, `1 2 3 4 5`, `1` | Output: `0`
- **TC 2:** Input: `5`, `1 2 3 4 5`, `5` | Output: `4`
- **TC 3:** Input: `5`, `1 2 3 4 5`, `6` | Output: `-1`
- **TC 4:** Input: `1`, `10`, `10` | Output: `0`
- **TC 5:** Input: `6`, `2 4 6 8 10 12`, `10` | As sample.  
**1️⃣3️⃣ Tags:** Binary Search, Searching, Algorithms  
**1️⃣4️⃣ Time Complexity:** O(log N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD8_116
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Identity Matrix Checker  
**5️⃣ Problem Description:** Check if a given $N \times N$ square matrix is an Identity Matrix (Diagonal elements are 1, others are 0).  
**6️⃣ Input Format:**
- $N$
- Matrix elements  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** $1 \leq N \leq 10$  
**9️⃣ Sample Input:**
`2`
`1 0`
`0 1`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Check $A[i][j]$: if $i==j$, value must be 1; else 0.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `1` | Output: `Yes`
- **TC 2:** Input: `2`, `1 1 1 1` | Output: `No`
- **TC 3:** Input: `3`, `1 0 0 0 1 0 0 0 1` | Output: `Yes`
- **TC 4:** Input: `2`, `2 0 0 2` | Output: `No`
- **TC 5:** Input: `2`, `1 0 0 1` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix, Logic  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N^2)

---

### 1️⃣ Question ID: C_MOD8_117
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Hard  
**4️⃣ Problem Title:** Matrix Multiplication  
**5️⃣ Problem Description:** Write a program to multiply two matrices. Matrix 1 size $R1 \times C1$ and Matrix 2 size $R2 \times C2$. Assume $C1 == R2$.  
**6️⃣ Input Format:**
- $R1, C1$
- Matrix 1 elements
- $R2, C2$
- Matrix 2 elements  
**7️⃣ Output Format:** Resulting Matrix.  
**8️⃣ Constraints:** $1 \leq R, C \leq 5$  
**9️⃣ Sample Input:**
`2 2`
`1 2`
`3 4`
`2 1`
`5`
`6`  
**🔟 Sample Output:**
17
39  
**1️⃣1️⃣ Explanation:** $C[i][j] = \sum (A[i][k] \times B[k][j])$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `2`, `1 1`, `3` | Output: `6`
- **TC 2:** Input: `2 2`, `1 0 0 1`, `2 2`, `5 6 7 8` | Output: `5 6`, `7 8`
- **TC 3:** Input: `2 2`, `1 2 3 4`, `2 2`, `1 0 0 1` | Output: `1 2`, `3 4`
- **TC 4:** Input: `2 2`, `0 0 0 0`, `2 2`, `1 2 3 4` | Output: `0 0`, `0 0`
- **TC 5:** Input: Sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix Multiplication, Hard  
**1️⃣4️⃣ Time Complexity:** O(R1 * C2 * C1)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_118
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Sparse Matrix Checker  
**5️⃣ Problem Description:** A matrix is sparse if the number of zeros is greater than half the total number of elements. Check if an $R \times C$ matrix is sparse.  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements  
**7️⃣ Output Format:** "Sparse" or "Not Sparse".  
**8️⃣ Constraints:** $1 \leq R, C \leq 10$  
**9️⃣ Sample Input:**
`2 2`
`1 0`
`0 0`  
**🔟 Sample Output:** `Sparse`  
**1️⃣1️⃣ Explanation:** Total 4 elements. Zero count is 3. 3 > 2, so Sparse.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `0` | Output: `Sparse`
- **TC 2:** Input: `2 2`, `1 1 1 1` | Output: `Not Sparse`
- **TC 3:** Input: `3 3`, `1 0 0 0 1 0 0 0 1` | Output: `Sparse` (6 zeros out of 9)
- **TC 4:** Input: `2 2`, `0 0 1 1` | Output: `Not Sparse` (Zero count 2 is not > 2)
- **TC 5:** Input: `2 2`, `1 0 0 0` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix Property  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)

---

### 1️⃣ Question ID: C_MOD8_119
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Insertion Sort  
**5️⃣ Problem Description:** Sort an array using Insertion Sort. (Optional: Suitable for small arrays).  
**6️⃣ Input Format:**
- $N$
- Array elements  
**7️⃣ Output Format:** Sorted array.  
**8️⃣ Constraints:** $1 \leq N \leq 100$  
**9️⃣ Sample Input:**
`5`
`12 11 13 5 6`  
**🔟 Sample Output:** `5 6 11 12 13`  
**1️⃣1️⃣ Explanation:** Build a sorted array one element at a time by picking from the unsorted part and inserting it at the correct position.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `2`, `10 5` | Output: `5 10`
- **TC 2:** Input: `4`, `1 3 2 4` | Output: `1 2 3 4`
- **TC 3:** Input: `3`, `-1 -2 -3` | Output: `-3 -2 -1`
- **TC 4:** Input: `1`, `7` | Output: `7`
- **TC 5:** Input: `5`, `12 11 13 5 6` | As sample.  
**1️⃣3️⃣ Tags:** Sorting, Insertion Sort, Algorithms  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD8_120
**2️⃣ Module Name:** Arrays (2D), Searching & Sorting  
**3️⃣ Difficulty Level:** hard  
**4️⃣ Problem Title:** Spiral Matrix Print  
**5️⃣ Problem Description:** Print an $R \times C$ matrix in spiral order.  
**6️⃣ Input Format:**
- $R, C$
- Matrix elements  
**7️⃣ Output Format:** Elements in spiral order separated by space.  
**8️⃣ Constraints:** $1 \leq R, C \leq 5$  
**9️⃣ Sample Input:**
`3 3`
`1 2 3`
`4 5 6`
`7 8 9`  
**🔟 Sample Output:** `1 2 3 6 9 8 7 4 5`  
**1️⃣1️⃣ Explanation:** Use four boundaries (`top`, `bottom`, `left`, `right`) and iterate in cycles.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 1`, `5` | Output: `5`
- **TC 2:** Input: `2 2`, `1 2 3 4` | Output: `1 2 4 3`
- **TC 3:** Input: `1 3`, `1 2 3` | Output: `1 2 3`
- **TC 4:** Input: `3 1`, `10 20 30` | Output: `10 20 30`
- **TC 5:** Input: `3 3`, `1 2 3 4 5 6 7 8 9` | As sample.  
**1️⃣3️⃣ Tags:** 2D Arrays, Matrix, Patterns, Hard  
**1️⃣4️⃣ Time Complexity:** O(R * C)  
**1️⃣5️⃣ Space Complexity:** O(R * C)
---

---

## MODULE 9: Strings

---

### 1️⃣ Question ID: C_MOD9_121
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** String Length  
**5️⃣ Problem Description:** Input a string and calculate its length without using the `strlen()` function.  
**6️⃣ Input Format:** A string (may contain spaces).  
**7️⃣ Output Format:** A single integer.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `Hello World`  
**🔟 Sample Output:** `11`  
**1️⃣1️⃣ Explanation:** Loop through the string until you encounter the null terminator `\0`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `a` | Output: `1`
- **TC 2:** Input: ` ` | Output: `1` (Space)
- **TC 3:** Input: `C Programming` | Output: `13`
- **TC 4:** Input: `12345` | Output: `5`
- **TC 5:** Input: `Hello World` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Basic, Null Terminator  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N) (Input storage)

---

### 1️⃣ Question ID: C_MOD9_122
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** String Copy  
**5️⃣ Problem Description:** Copy one string to another without using `strcpy()`.  
**6️⃣ Input Format:** A source string $S$.  
**7️⃣ Output Format:** The destination string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `Hello`  
**🔟 Sample Output:** `Hello`  
**1️⃣1️⃣ Explanation:** Copy each character `dest[i] = src[i]` until `\0`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `a` | Output: `a`
- **TC 2:** Input: `123` | Output: `123`
- **TC 3:** Input: `Space Test` | Output: `Space Test`
- **TC 4:** Input: `LongStringWithNoSpaces` | Output: `LongStringWithNoSpaces`
- **TC 5:** Input: `Hello` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Manipulation  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_123
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** String Concatenation  
**5️⃣ Problem Description:** Join (concatenate) two strings without using `strcat()`.  
**6️⃣ Input Format:** Two space-separated strings (on separate lines if they contain spaces).  
**7️⃣ Output Format:** Joined string.  
**8️⃣ Constraints:** Combined length $\leq 200$  
**9️⃣ Sample Input:**
`Hello `
`World`  
**🔟 Sample Output:** `Hello World`  
**1️⃣1️⃣ Explanation:** Find the end of the first string and start appending the second string from there.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `A`, `B` | Output: `AB`
- **TC 2:** Input: `Hey`, `There` | Output: `HeyThere`
- **TC 3:** Input: ` `, `Space` | Output: ` Space`
- **TC 4:** Input: `123`, `456` | Output: `123456`
- **TC 5:** Input: `Hello `, `World` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Manipulation  
**1️⃣4️⃣ Time Complexity:** O(N1 + N2)  
**1️⃣5️⃣ Space Complexity:** O(N1 + N2)

---

### 1️⃣ Question ID: C_MOD9_124
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** String Comparison  
**5️⃣ Problem Description:** Compare two strings lexicographically without using `strcmp()`. Output `0` if equal, `1` if the first is greater, and `-1` if the second is greater.  
**6️⃣ Input Format:** Two strings.  
**7️⃣ Output Format:** `0`, `1`, or `-1`.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:**
`apple`
`banana`  
**🔟 Sample Output:** `-1`  
**1️⃣1️⃣ Explanation:** Compare character by character. If difference found, return sign of `str1[i] - str2[i]`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `abc`, `abc` | Output: `0`
- **TC 2:** Input: `abd`, `abc` | Output: `1`
- **TC 3:** Input: `abc`, `abd` | Output: `-1`
- **TC 4:** Input: `apple`, `apples` | Output: `-1`
- **TC 5:** Input: `banana`, `apple` | Output: `1`  
**1️⃣3️⃣ Tags:** Strings, Logic, Comparison  
**1️⃣4️⃣ Time Complexity:** O(min(N1, N2))  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_125
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Reverse a String  
**5️⃣ Problem Description:** Reverse a given string in-place without using `strrev()`.  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:** Reversed string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `Coding`  
**🔟 Sample Output:** `gnidoC`  
**1️⃣1️⃣ Explanation:** Swap characters from both ends until the middle.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `a` | Output: `a`
- **TC 2:** Input: `ab` | Output: `ba`
- **TC 3:** Input: `level` | Output: `level`
- **TC 4:** Input: `12345` | Output: `54321`
- **TC 5:** Input: `Coding` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Reverse  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_126
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** String Palindrome  
**5️⃣ Problem Description:** Check if a given string is a palindrome. (Case-sensitive).  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:** "Yes" or "No".  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `madam`  
**🔟 Sample Output:** `Yes`  
**1️⃣1️⃣ Explanation:** Compare the string with its reverse or compare characters from both ends.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `racecar` | Output: `Yes`
- **TC 2:** Input: `hello` | Output: `No`
- **TC 3:** Input: `Madam` | Output: `No` (Case-sensitive)
- **TC 4:** Input: `a` | Output: `Yes`
- **TC 5:** Input: `aba` | Output: `Yes`  
**1️⃣3️⃣ Tags:** Strings, Palindrome  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_127
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Count Vowels and Consonants  
**5️⃣ Problem Description:** Input a string and count the number of vowels and consonants in it. Ignore spaces and digits.  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:**
Vowels: [V]
Consonants: [C]  
**8️⃣ Constraints:** Length $\leq 1000$  
**9️⃣ Sample Input:** `Learning C is fun!`  
**🔟 Sample Output:**
Vowels: 5
Consonants: 8  
**1️⃣1️⃣ Explanation:** Iterate through the string, use `tolower()` for case-insensitivity, and check against `a, e, i, o, u`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `aeiou` | Output: `Vowels: 5`, `Consonants: 0`
- **TC 2:** Input: `bcd` | Output: `Vowels: 0`, `Consonants: 3`
- **TC 3:** Input: `123!` | Output: `Vowels: 0`, `Consonants: 0`
- **TC 4:** Input: `HELLO` | Output: `Vowels: 2`, `Consonants: 3`
- **TC 5:** Input: `Learning C is fun!` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Character Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_128
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Uppercase to Lowercase  
**5️⃣ Problem Description:** Convert a given uppercase string to lowercase without using `strlwr()`.  
**6️⃣ Input Format:** A string in ALL CAPS.  
**7️⃣ Output Format:** String in lowercase.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `GEMINI`  
**🔟 Sample Output:** `gemini`  
**1️⃣1️⃣ Explanation:** Loop through the string, add 32 to the ASCII value of each uppercase letter.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `A` | Output: `a`
- **TC 2:** Input: `HELLO` | Output: `hello`
- **TC 3:** Input: `C PROG` | Output: `c prog`
- **TC 4:** Input: `123` | Output: `123`
- **TC 5:** Input: `GEMINI` | As sample.  
**1️⃣3️⃣ Tags:** Strings, ASCII, Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_129
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Toggle Case  
**5️⃣ Problem Description:** Write a program that converts every uppercase character to lowercase and every lowercase character to uppercase in a given string.  
**6️⃣ Input Format:** A mixed-case string.  
**7️⃣ Output Format:** String with toggled case.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `aBc123De`  
**🔟 Sample Output:** `AbC123dE`  
**1️⃣1️⃣ Explanation:** Use `isupper()` and `islower()` from `ctype.h` or ASCII checks.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `abc` | Output: `ABC`
- **TC 2:** Input: `ABC` | Output: `abc`
- **TC 3:** Input: `a1B2` | Output: `A1b2`
- **TC 4:** Input: ` ` | Output: ` `
- **TC 5:** Input: `aBc123De` | As sample.  
**1️⃣3️⃣ Tags:** Strings, ctype.h, Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_130
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Word Count  
**5️⃣ Problem Description:** Calculate the total number of words in a given sentence. Assume words are separated by a single space.  
**6️⃣ Input Format:** A sentence.  
**7️⃣ Output Format:** Number of words.  
**8️⃣ Constraints:** Length $\leq 500$  
**9️⃣ Sample Input:** `Learning to code is exciting`  
**🔟 Sample Output:** `5`  
**1️⃣1️⃣ Explanation:** Count the number of spaces and add 1 (handle empty strings if necessary).  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `Hello` | Output: `1`
- **TC 2:** Input: `Hello World` | Output: `2`
- **TC 3:** Input: `   ` (Spaces only) | Output: `0` (or 1 depending on logic - let's assume 0 for empty words)
- **TC 4:** Input: `C is fun` | Output: `3`
- **TC 5:** Input: `Learning to code is exciting` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Logic, Word Counting  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_131
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Remove Special Characters  
**5️⃣ Problem Description:** Remove all non-alphabetic characters (numbers, symbols) from a string.  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:** Cleaned string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `P@r0gr@m!ng`  
**🔟 Sample Output:** `Prgrmng`  
**1️⃣1️⃣ Explanation:** Build a new string (or modify in-place) by checking `isalpha()`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `abc123` | Output: `abc`
- **TC 2:** Input: `!@#` | Output: (Empty)
- **TC 3:** Input: `Hello 2024` | Output: `Hello ` (wait, space is not alpha) $\to$ `Hello`
- **TC 4:** Input: `C++` | Output: `C`
- **TC 5:** Input: `P@r0gr@m!ng` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Validation, Logic  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_132
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Substring Finding  
**5️⃣ Problem Description:** Find if a substring exists within a main string. If found, print "Found" and its first occurrence index; else print "Not Found". (Constraint: Do not use `strstr()`).  
**6️⃣ Input Format:**
Main String
Substring  
**7️⃣ Output Format:** `Found at index: [I]` or `Not Found`.  
**8️⃣ Constraints:** Lengths $\leq 100$  
**9️⃣ Sample Input:**
`Programming`
`gram`  
**🔟 Sample Output:** `Found at index: 3`  
**1️⃣1️⃣ Explanation:** Use nested loops to check if segments of the main string match the substring.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `Hello`, `ell` | Output: `Found at index: 1`
- **TC 2:** Input: `Hello`, `low` | Output: `Not Found`
- **TC 3:** Input: `abcde`, `a` | Output: `Found at index: 0`
- **TC 4:** Input: `abcde`, `z` | Output: `Not Found`
- **TC 5:** Input: `Programming`, `gram` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Substring, Nested Loops  
**1️⃣4️⃣ Time Complexity:** O(N * M)  
**1️⃣5️⃣ Space Complexity:** O(N+M)

---

### 1️⃣ Question ID: C_MOD9_133
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Sort String Characters  
**5️⃣ Problem Description:** Sort the characters of a string alphabetically.  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:** Sorted string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `cba`  
**🔟 Sample Output:** `abc`  
**1️⃣1️⃣ Explanation:** Use any sorting algorithm (like Bubble Sort) comparing ASCII values of characters.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `dcba` | Output: `abcd`
- **TC 2:** Input: `hello` | Output: `ehllo`
- **TC 3:** Input: `Cba` | Output: `Cba` (ASCII check: `C` < `a`)
- **TC 4:** Input: `132` | Output: `123`
- **TC 5:** Input: `cba` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Sorting  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_134
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Remove Duplicates  
**5️⃣ Problem Description:** Remove all duplicate characters from a string so that each character appears only once.  
**6️⃣ Input Format:** A string.  
**7️⃣ Output Format:** Modified string.  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:** `programming`  
**🔟 Sample Output:** `progamin`  
**1️⃣1️⃣ Explanation:** Use a secondary array or frequency check to keep only the first occurrence of each character.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `aaaa` | Output: `a`
- **TC 2:** Input: `abc` | Output: `abc`
- **TC 3:** Input: `1122` | Output: `12`
- **TC 4:** Input: `banana` | Output: `ban`
- **TC 5:** Input: `programming` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Logic, Uniqueness  
**1️⃣4️⃣ Time Complexity:** O(N^2)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD9_135
**2️⃣ Module Name:** Strings  
**3️⃣ Difficulty Level:** hard  
**4️⃣ Problem Title:** Anagram Checker  
**5️⃣ Problem Description:** Check if two strings are anagrams of each other (contain the same characters in any order).  
**6️⃣ Input Format:** Two strings.  
**7️⃣ Output Format:** "Anagrams" or "Not Anagrams".  
**8️⃣ Constraints:** Length $\leq 100$  
**9️⃣ Sample Input:**
`listen`
`silent`  
**🔟 Sample Output:** `Anagrams`  
**1️⃣1️⃣ Explanation:** Sort both strings and compare, or use a frequency array to count characters.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `abc`, `cba` | Output: `Anagrams`
- **TC 2:** Input: `test`, `best` | Output: `Not Anagrams`
- **TC 3:** Input: `rail safety`, `fairy tales` | Output: `Anagrams`
- **TC 4:** Input: `abc`, `abcd` | Output: `Not Anagrams`
- **TC 5:** Input: `listen`, `silent` | As sample.  
**1️⃣3️⃣ Tags:** Strings, Anagram, Frequency Array  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1) (fixed size char set)
---

---

## MODULE 10: Pointers, Structures & File Handling

---

### 1️⃣ Question ID: C_MOD10_136
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Pointer Basics  
**5️⃣ Problem Description:** Write a program to declare an integer variable, a pointer to that integer, and print the address and value using the pointer.  
**6️⃣ Input Format:** A single integer $N$.  
**7️⃣ Output Format:**
Value: [V]
Address: [Hex Address] (or "Stored in pointer" for generic output)  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** `10`  
**🔟 Sample Output:**
Value: 10
Address: [Some Hex Address]  
**1️⃣1️⃣ Explanation:** Use `&` (address-of) and `*` (dereference) operators.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `5` | Output: `Value: 5`
- **TC 2:** Input: `-1` | Output: `Value: -1`
- **TC 3:** Input: `0` | Output: `Value: 0`
- **TC 4:** Output contains "Address:"  
**1️⃣3️⃣ Tags:** Pointers, Address-of, Dereferencing  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_137
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Swap using Pointers  
**5️⃣ Problem Description:** Implement a function `void swap(int *a, int *b)` that swaps two integers using pointers (call by reference).  
**6️⃣ Input Format:** Two space-separated integers $X$ and $Y$.  
**7️⃣ Output Format:** Swapped values `Y X`.  
**8️⃣ Constraints:** Standard int range.  
**9️⃣ Sample Input:** `10 20`  
**🔟 Sample Output:** `20 10`  
**1️⃣1️⃣ Explanation:** Use a temporary variable to swap values pointed to by `a` and `b`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 2` | Output: `2 1`
- **TC 2:** Input: `5 5` | Output: `5 5`
- **TC 3:** Input: `-10 10` | Output: `10 -10`
- **TC 4:** Input: `0 0` | Output: `0 0`
- **TC 5:** Input: `10 20` | As sample.  
**1️⃣3️⃣ Tags:** Pointers, Call by Reference, Swapping  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_138
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Pointer Arithmetic  
**5️⃣ Problem Description:** Input an array of 5 integers and print its elements using pointer increment (`ptr++`) rather than indexing.  
**6️⃣ Input Format:** 5 integers.  
**7️⃣ Output Format:** 5 integers separated by space.  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** `1 2 3 4 5`  
**🔟 Sample Output:** `1 2 3 4 5`  
**1️⃣1️⃣ Explanation:** Initialize pointer to array start, loop 5 times, print `*ptr` and increment.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 20 30 40 50` | Output: `10 20 30 40 50`
- **TC 2:** Input: `0 0 0 0 0` | Output: `0 0 0 0 0`
- **TC 3:** Input: `-1 -2 -3 -4 -5` | Output: `-1 -2 -3 -4 -5`  
**1️⃣3️⃣ Tags:** Pointers, Pointer Arithmetic, Arrays  
**1️⃣4️⃣ Time Complexity:** O(1) (fixed size)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_139
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** Define a Structure  
**5️⃣ Problem Description:** Create a structure `Student` with fields: `id` (int), `name` (string), and `marks` (float). Input data for one student and display it.  
**6️⃣ Input Format:**
- ID
- Name
- Marks  
**7️⃣ Output Format:**
ID: [id]
Name: [name]
Marks: [marks]  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:**
`101`
`Rahul`
`85.5`  
**🔟 Sample Output:**
ID: 101
Name: Rahul
Marks: 85.50  
**1️⃣1️⃣ Explanation:** Declare the struct, create an instance, and use `.` operator for access.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `A`, `10` | Output: `ID: 1`, `Name: A`, `Marks: 10.00`
- **TC 2:** Input: `2`, `John`, `99.9` | Output: `ID: 2`, `Name: John`, `Marks: 99.90`
- **TC 3:** Input: `101`, `Rahul`, `85.5` | As sample.  
**1️⃣3️⃣ Tags:** Structures, Basic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_140
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Array of Structures  
**5️⃣ Problem Description:** Input details for $N$ students (ID, Name, Marks) into an array of structures. Calculate and print the average marks of all students.  
**6️⃣ Input Format:**
- $N$
- For each $N$: ID, Name, Marks  
**7️⃣ Output Format:** Average marks rounded to 2 decimal places.  
**8️⃣ Constraints:** $1 \leq N \leq 10$  
**9️⃣ Sample Input:**
`2`
`1 Rahul 80`
`2 Amit 90`  
**🔟 Sample Output:** `85.00`  
**1️⃣1️⃣ Explanation:** Sum the marks field of all struct elements in the array and divide by $N$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1`, `1 A 10` | Output: `10.00`
- **TC 2:** Input: `3`, `1 A 10`, `2 B 20`, `3 C 30` | Output: `20.00`
- **TC 3:** Input: `2`, `1 X 75.5`, `2 Y 74.5` | Output: `75.00`
- **TC 4:** Input: Sample.  
**1️⃣3️⃣ Tags:** Structures, Arrays, Average  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(N)

---

### 1️⃣ Question ID: C_MOD10_141
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Nested Structures  
**5️⃣ Problem Description:** Create a structure `Date` (day, month, year). Create another structure `Employee` which has a name and a field of type `Date` (joining date). Input and display employee details.  
**6️⃣ Input Format:**
- Name
- Day Month Year  
**7️⃣ Output Format:** Name: [N], Joined: [D/M/Y]  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:**
`Alice`
`15 08 2022`  
**🔟 Sample Output:** `Name: Alice, Joined: 15/8/2022`  
**1️⃣1️⃣ Explanation:** Access nested fields using `employee.joinDate.day`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `Bob`, `1 1 2020` | Output: `Name: Bob, Joined: 1/1/2020`
- **TC 2:** Input: `Dev`, `31 12 1999` | Output: `Name: Dev, Joined: 31/12/1999`
- **TC 3:** Input: Sample.  
**1️⃣3️⃣ Tags:** Structures, Nesting  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_142
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Distance Structure  
**5️⃣ Problem Description:** Create a structure `Distance` containing `feet` (int) and `inches` (float). Write a program to add two distances. (12 inches = 1 foot).  
**6️⃣ Input Format:**
- Feet and Inches for Distance 1
- Feet and Inches for Distance 2  
**7️⃣ Output Format:** Total distance in Feet and Inches.  
**8️⃣ Constraints:** Positive values.  
**9️⃣ Sample Input:**
`5 10`
`2 4`  
**🔟 Sample Output:** `8 Feet, 2.0 Inches`  
**1️⃣1️⃣ Explanation:** $10+4 = 14$ inches $\to 1$ foot, $2$ inches. Total feet: $5+2+1 = 8$.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `1 6`, `0 6` | Output: `2 Feet, 0.0 Inches`
- **TC 2:** Input: `10 0`, `5 0` | Output: `15 Feet, 0.0 Inches`
- **TC 3:** Input: `0 11`, `0 2` | Output: `1 Feet, 1.0 Inches`
- **TC 4:** Input: Sample.  
**1️⃣3️⃣ Tags:** Structures, Math, Real-world Logic  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_143
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Hard  
**4️⃣ Problem Title:** Array vs Pointer in String  
**5️⃣ Problem Description:** Explain the difference between `char str[] = "Hello"` and `char *ptr = "Hello"`. Write a program to change a character in the first one and explain why the second one might cause a segmentation fault if you try to modify it directly.  
**Note:** The task is to successfully modify `str` and print it.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** Modified string.  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `Kello` (if 'H' changed to 'K')  
**1️⃣1️⃣ Explanation:** Character arrays are writable; string literals pointed to by `char *` are often stored in read-only memory.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Output shows modified string.  
**1️⃣3️⃣ Tags:** Pointers, Strings, Memory Management  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_144
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Pointer To Structure  
**5️⃣ Problem Description:** Create a structure `Rectangle` (length, width). Use a structure pointer and the arrow operator (`->`) to input and calculate area.  
**6️⃣ Input Format:** Length and Width.  
**7️⃣ Output Format:** Area.  
**8️⃣ Constraints:** Positive numbers.  
**9️⃣ Sample Input:** `5 4`  
**🔟 Sample Output:** `20`  
**1️⃣1️⃣ Explanation:** `ptr->length` is equivalent to `(*ptr).length`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Input: `10 10` | Output: `100`
- **TC 2:** Input: `1 5` | Output: `5`
- **TC 3:** Input: `0 5` | Output: `0`
- **TC 4:** Input: `5 4` | As sample.  
**1️⃣3️⃣ Tags:** Structures, Pointers, Arrow Operator  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_145
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** File Write  
**5️⃣ Problem Description:** Write a program to create a file named `output.txt` and write the string "C Question Bank" into it.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** "File written successfully".  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `File written successfully`  
**1️⃣1️⃣ Explanation:** Use `fopen()`, `fprintf()`, and `fclose()`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Check if file exists and contains text.  
**1️⃣3️⃣ Tags:** File Handling, IO  
**1️⃣4️⃣ Time Complexity:** O(N) (string length)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_146
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Easy  
**4️⃣ Problem Title:** File Read  
**5️⃣ Problem Description:** Read the content of a file `data.txt` and display it on the console. (Assume `data.txt` already exists).  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** Content of the file.  
**8️⃣ Constraints:** File size $\leq 1000$ bytes.  
**9️⃣ Sample Input:** (Assume file has "Hello C")  
**🔟 Sample Output:** `Hello C`  
**1️⃣1️⃣ Explanation:** Use `fgets()` or `fgetc()` in a loop until `EOF`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Content matching file content.  
**1️⃣3️⃣ Tags:** File Handling, Read  
**1️⃣4️⃣ Time Complexity:** O(FileSize)  
**1️⃣5️⃣ Space Complexity:** O(1) or buffer size.

---

### 1️⃣ Question ID: C_MOD10_147
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Copy File Content  
**5️⃣ Problem Description:** Write a program to copy the content of `source.txt` to `destination.txt`.  
**6️⃣ Input Format:** None.  
**7️⃣ Output Format:** "Content copied".  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** None.  
**🔟 Sample Output:** `Content copied`  
**1️⃣1️⃣ Explanation:** Open both files, read from one and write to the other.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Destination file matches source file.  
**1️⃣3️⃣ Tags:** File Handling, Copy  
**1️⃣4️⃣ Time Complexity:** O(N)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_148
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Count Lines in File  
**5️⃣ Problem Description:** Write a program to count the total number of lines in a text file.  
**6️⃣ Input Format:** None (Assume file exists).  
**7️⃣ Output Format:** Number of lines.  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** (Assume file has 3 lines)  
**🔟 Sample Output:** `3`  
**1️⃣1️⃣ Explanation:** Count the occurrences of the newline character `\n`.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** File with 1 line.
- **TC 2:** File with 0 lines.
- **TC 3:** Large file.  
**1️⃣3️⃣ Tags:** File Handling, Logic  
**1️⃣4️⃣ Time Complexity:** O(FileSize)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_149
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** Medium  
**4️⃣ Problem Title:** Union Exploration  
**5️⃣ Problem Description:** Explain the difference between `struct` and `union` in C. Write a program to define a `union Data { int i; float f; char c; }`, assign a value to `i`, and see what happens to `f` and `c`.  
**6️⃣ Input Format:** An integer for field `i`.  
**7️⃣ Output Format:**
i: [val]
f: [garbage/linked]
c: [char equivalent]
Size: [Shared Size]  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** `65`  
**🔟 Sample Output:**
i: 65
f: (Some value)
c: A
Size: (Usually 4)  
**1️⃣1️⃣ Explanation:** Unions share the same memory location for all members.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Check if `c` is 'A' when `i` is 65.  
**1️⃣3️⃣ Tags:** Union, Memory, Basics  
**1️⃣4️⃣ Time Complexity:** O(1)  
**1️⃣5️⃣ Space Complexity:** O(1)

---

### 1️⃣ Question ID: C_MOD10_150
**2️⃣ Module Name:** Pointers, Structures & File Handling  
**3️⃣ Difficulty Level:** hard  
**4️⃣ Problem Title:** Search Records in File  
**5️⃣ Problem Description:** Assume a file contains student records (one per line: ID Name Marks). Write a program to search for a student by ID and print their details.  
**6️⃣ Input Format:** Student ID to search.  
**7️⃣ Output Format:** "Found: [Details]" or "Not Found".  
**8️⃣ Constraints:** None.  
**9️⃣ Sample Input:** `101`  
**🔟 Sample Output:** `Found: 101 Rahul 85.5`  
**1️⃣1️⃣ Explanation:** Use `fscanf()` in a loop to read one line at a time until the end of the file.  
**1️⃣2️⃣ Test Cases:**
- **TC 1:** Existing ID.
- **TC 2:** Non-existing ID.  
**1️⃣3️⃣ Tags:** File Handling, Structures, Searching, Hard  
**1️⃣4️⃣ Time Complexity:** O(FileSize)  
**1️⃣5️⃣ Space Complexity:** O(1)
---
