# C Programming Course: Zero to Advanced

## Module 9: Strings
**Level:** Intermediate | **Questions:** 10

**Topics covered:** character arrays, the null terminator, manual string operations (without `<string.h>` where specified), case conversion, anagrams, word counting.

**Before you start:**
- A C string is a `char` array ending with the null character `'\0'`. `char s[100];` reserves 100 bytes; a string of length 99 plus the null terminator fits exactly.
- Read a full line (including spaces) with `fgets(s, sizeof(s), stdin)`. Read a single word with `scanf("%s", s)` (no `&` needed for a char array).
- `fgets` keeps the trailing `\n` in the string — strip it before processing, e.g. `s[strcspn(s, "\n")] = '\0';`.
- Where a question says "without `strlen`/`strcmp`/etc.", write the logic yourself using a loop, to practice how these functions work internally.

---

## Question 1: Length of a String Without `strlen`
**Difficulty:** Easy

**Problem Description:**
Read a string (a single word, no spaces) and print its length, without using the `strlen()` function.

**Input Format:** A single line containing one word.

**Output Format:** `Length = <value>`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
hello

Output:
Length = 5
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `hello` | `Length = 5` |
| 2 | `a` | `Length = 1` |
| 3 | `programming` | `Length = 11` |

**Hint:** Loop through the array and stop when you reach `'\0'`: `while (s[i] != '\0') i++;` then `i` is the length.

---

## Question 2: Reverse a String
**Difficulty:** Easy

**Problem Description:**
Read a string (a single word) and print it reversed.

**Input Format:** A single line containing one word.

**Output Format:** The reversed string.

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
hello

Output:
olleh
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `hello` | `olleh` |
| 2 | `a` | `a` |
| 3 | `civic` | `civic` |

**Hint:** Either print from the last index down to 0, or swap characters using two pointers from both ends toward the middle.

---

## Question 3: Palindrome String Check
**Difficulty:** Easy–Medium

**Problem Description:**
Read a string and check whether it reads the same forward and backward. Comparison should be **case-sensitive** for this question (treat `'A'` and `'a'` as different).

**Input Format:** A single line containing one word.

**Output Format:** `Palindrome` or `Not a Palindrome`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
madam

Output:
Palindrome
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `madam` | `Palindrome` |
| 2 | `hello` | `Not a Palindrome` |
| 3 | `Madam` | `Not a Palindrome` |

*Note:* Test 3 shows why case sensitivity matters — `Madam` is not equal to `madaM` character by character (`M` ≠ `m`).

**Hint:** Compare `s[i]` with `s[len - 1 - i]` for `i` from `0` to `len/2 - 1`.

---

## Question 4: Count Vowels, Consonants, Digits and Spaces
**Difficulty:** Easy–Medium

**Problem Description:**
Read a full line of text (which may include spaces, letters and digits). Count and print the number of vowels, consonants, digits and spaces in it. Treat both uppercase and lowercase letters.

**Input Format:** One full line of text.

**Output Format:**
```
Vowels = <count>
Consonants = <count>
Digits = <count>
Spaces = <count>
```

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
Hello World 123

Output:
Vowels = 3
Consonants = 7
Digits = 3
Spaces = 2
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Hello World 123` | `Vowels = 3` <br> `Consonants = 7` <br> `Digits = 3` <br> `Spaces = 2` |
| 2 | `abcde` | `Vowels = 2` <br> `Consonants = 3` <br> `Digits = 0` <br> `Spaces = 0` |
| 3 | `12345` | `Vowels = 0` <br> `Consonants = 0` <br> `Digits = 5` <br> `Spaces = 0` |

**Hint:** Use `fgets` to read the whole line including spaces. For each character, check in this order: is it a letter? (then vowel or consonant), is it a digit?, is it a space? Skip punctuation entirely (not counted in any category).

---

## Question 5: Compare Two Strings Without `strcmp`
**Difficulty:** Medium

**Problem Description:**
Read two strings (single words) and compare them without using `strcmp()`. Print `Equal` if identical, `s1 is smaller` if the first string comes before the second in dictionary (lexicographic) order, or `s1 is greater` otherwise.

**Input Format:** Two lines, one string per line.

**Output Format:** `Equal`, `s1 is smaller`, or `s1 is greater`.

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
apple
banana

Output:
s1 is smaller
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `apple` / `banana` | `s1 is smaller` |
| 2 | `dog` / `cat` | `s1 is greater` |
| 3 | `same` / `same` | `Equal` |

**Hint:** Walk both strings together; at the first position where the characters differ, compare their ASCII values. If you reach the end of both at the same time with no difference, they are equal.

---

## Question 6: Concatenate Two Strings Without `strcat`
**Difficulty:** Medium

**Problem Description:**
Read two strings (single words) and print their concatenation (the second string appended to the end of the first), without using `strcat()`.

**Input Format:** Two lines, one string per line.

**Output Format:** The concatenated string on one line.

**Constraints:** Combined length ≤ 2000

**Example:**
```
Input:
Hello
World

Output:
HelloWorld
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Hello` / `World` | `HelloWorld` |
| 2 | `abc` / `` (empty) | `abc` |
| 3 | `` (empty) / `xyz` | `xyz` |

**Hint:** Find the length of the first string (or the index of its `'\0'`), then copy each character of the second string starting from that index, and finally add a `'\0'` at the end.

---

## Question 7: Remove All Spaces from a String
**Difficulty:** Medium

**Problem Description:**
Read a full line of text and print it with all spaces removed.

**Input Format:** One full line of text.

**Output Format:** The text with spaces removed.

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
C Programming is Fun

Output:
CProgrammingisFun
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `C Programming is Fun` | `CProgrammingisFun` |
| 2 | `no spaces here` | `nospaceshere` |
| 3 | `noSpacesAtAll` | `noSpacesAtAll` |

**Hint:** Use two indices: a read index `i` scanning the original string, and a write index `j` building the result. Copy `s[i]` to `result[j++]` only when `s[i] != ' '`.

---

## Question 8: Convert Case (Upper to Lower and Lower to Upper)
**Difficulty:** Easy–Medium

**Problem Description:**
Read a string of letters and print two versions of it: the whole string converted to uppercase, and the whole string converted to lowercase. Do not use `toupper()`/`tolower()`; use ASCII arithmetic instead.

**Input Format:** A single line containing one word made only of letters.

**Output Format:**
```
Uppercase: <value>
Lowercase: <value>
```

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
HeLLo

Output:
Uppercase: HELLO
Lowercase: hello
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `HeLLo` | `Uppercase: HELLO` <br> `Lowercase: hello` |
| 2 | `ALLCAPS` | `Uppercase: ALLCAPS` <br> `Lowercase: allcaps` |
| 3 | `alllower` | `Uppercase: ALLLOWER` <br> `Lowercase: alllower` |

**Hint:** For a lowercase letter, `c - 32` gives the uppercase version (since `'a' - 'A' == 32`). Only convert a character when it is actually in the corresponding case range; leave other characters (if any) unchanged.

---

## Question 9: Check If Two Strings Are Anagrams
**Difficulty:** Medium

**Problem Description:**
Two strings are anagrams if they contain exactly the same letters with the same frequencies, ignoring case and ignoring spaces. Read two strings (they may contain spaces, so read full lines) and check whether they are anagrams of each other.

**Input Format:** Two lines, one string per line.

**Output Format:** `Anagrams` or `Not Anagrams`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
Listen
Silent

Output:
Anagrams
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `Listen` / `Silent` | `Anagrams` |
| 2 | `Hello` / `World` | `Not Anagrams` |
| 3 | `Dormitory` / `Dirty Room` | `Anagrams` |

*Note:* Test 3 shows why spaces must be ignored: `"Dirty Room"` has a space that `"Dormitory"` does not.

**Hint:** Build a frequency count of 26 letters (converted to lowercase, skipping non-letters) for each string, and compare the two count arrays.

---

## Question 10: Count Words and Find the Longest Word
**Difficulty:** Medium

**Problem Description:**
Read a full sentence (a line of text with words separated by single spaces). Count the number of words and print the longest word. If there is a tie for longest, print the **first** one that appears.

**Input Format:** One full line of text, words separated by single spaces, no leading/trailing spaces.

**Output Format:**
```
Word count = <count>
Longest word = <word>
```

**Constraints:** 1 ≤ length of line ≤ 1000

**Example:**
```
Input:
The quick brown fox jumps

Output:
Word count = 5
Longest word = quick
```

*Note:* `quick`, `brown` and `jumps` are all 5 letters, but `quick` appears first.

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `The quick brown fox jumps` | `Word count = 5` <br> `Longest word = quick` |
| 2 | `hello` | `Word count = 1` <br> `Longest word = hello` |
| 3 | `a bb ccc dd e` | `Word count = 5` <br> `Longest word = ccc` |

**Hint:** Scan character by character, tracking the current word's start position and length. A space (or the end of the string) marks the end of a word — compare its length to the best length found so far, updating only on a strictly greater length (to keep the first tie).

---

## Module 9 Challenge Questions (Optional)

1. **Remove Duplicate Characters:** Print a string with all repeated characters removed, keeping only the first occurrence of each. (Example: `"programming"` → `progamin`)
2. **Count Occurrences of a Substring:** Count how many times a given substring appears in a string (including overlapping occurrences). (Example: `"aaa"`, substring `"aa"` → `2`)
3. **Title Case Conversion:** Convert a sentence so that the first letter of every word is uppercase and the rest are lowercase. (Example: `"hello WORLD from C"` → `"Hello World From C"`)

---
*End of Module 9. Next: Module 10, Pointers.*
