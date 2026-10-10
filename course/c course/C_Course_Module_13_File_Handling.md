# C Programming Course: Zero to Advanced

## Module 13: File Handling
**Level:** Advanced | **Questions:** 10

**Topics covered:** `fopen`/`fclose`, text file read/write/append, character/word/line counting, copying and merging files, search-and-replace, binary file I/O with structures, `fseek`/`ftell`/`rewind`.

**Before you start:**
- Always check the return value of `fopen`: it returns `NULL` if the file cannot be opened.
- File modes: `"r"` (read, must exist), `"w"` (write, creates/overwrites), `"a"` (append, creates if missing), `"r+"`, `"w+"`, `"a+"` (add read/write), and add `"b"` for binary (e.g. `"rb"`, `"wb"`).
- Always `fclose()` every file you open.
- For these questions, "create a file" means your program should write to a fixed filename using relative path, e.g. `"data.txt"`, in the program's working directory.
- Where a question needs a file to already contain data, it specifies the exact content the grader will place in that file before running your program (the "given file content").

---

## Question 1: Create a File and Write Text Into It
**Difficulty:** Easy

**Problem Description:**
Read a line of text from the user and write it into a file named `output.txt` (overwriting it if it already exists). After writing, print a confirmation message.

**Input Format:** One line of text.

**Output Format:** `Data written to file successfully`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
Hello, this is my first file.

Output:
Data written to file successfully
```

**Test Cases:**

| # | Input | Expected Program Output | Resulting file `output.txt` |
|---|-------|--------------------------|------------------------------|
| 1 | `Hello, this is my first file.` | `Data written to file successfully` | `Hello, this is my first file.` |
| 2 | `C programming` | `Data written to file successfully` | `C programming` |
| 3 | `12345` | `Data written to file successfully` | `12345` |

**Hint:** `FILE *fp = fopen("output.txt", "w"); fprintf(fp, "%s", line); fclose(fp);`. Check `if (fp == NULL)` before writing.

---

## Question 2: Read and Print the Content of a File
**Difficulty:** Easy

**Problem Description:**
Read the entire content of `output.txt` (assume it exists and was created by Question 1, or is given beforehand) and print it to the screen exactly as it is.

**Input Format:** No standard input; the file `output.txt` already contains text.

**Output Format:** The exact content of the file.

**Constraints:** File exists and is readable; up to 10000 characters.

**Example:**
```
Given file output.txt contains:
Hello, this is my first file.

Program Output:
Hello, this is my first file.
```

**Test Cases:**

| # | Given file content | Expected Output |
|---|----------------------|------------------|
| 1 | `Hello World` | `Hello World` |
| 2 | `Line1` newline `Line2` | `Line1` <br> `Line2` |
| 3 | (empty file) | (nothing printed) |

**Hint:** `FILE *fp = fopen("output.txt", "r"); int ch; while ((ch = fgetc(fp)) != EOF) putchar(ch); fclose(fp);`. If `fopen` returns `NULL`, print `Error: file not found` and stop.

---

## Question 3: Append Data to an Existing File
**Difficulty:** Easy–Medium

**Problem Description:**
Read a line of text and append it (add it after the existing content, on a new line) to `output.txt`, without erasing what is already there.

**Input Format:** One line of text.

**Output Format:** `Data appended successfully`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Given file output.txt contains:
Hello, this is my first file.

Input:
This is the second line.

Output:
Data appended successfully

Resulting file output.txt:
Hello, this is my first file.
This is the second line.
```

**Test Cases:**

| # | Given file content | Input | Resulting file content |
|---|----------------------|-------|--------------------------|
| 1 | `Hello, this is my first file.` | `This is the second line.` | both lines, in order |
| 2 | (empty file) | `First ever line` | `First ever line` |
| 3 | `A` | `B` | `A` newline `B` |

**Hint:** Open with mode `"a"`: `FILE *fp = fopen("output.txt", "a"); fprintf(fp, "\n%s", line);`. Test 2 shows appending to an empty file behaves like creating fresh content.

---

## Question 4: Count Characters, Words and Lines in a File
**Difficulty:** Medium

**Problem Description:**
Read the content of a given file `data.txt` and count the total number of characters (excluding newline characters), words (sequences separated by whitespace), and lines.

**Input Format:** No standard input; `data.txt` contains the text to analyze.

**Output Format:**
```
Characters = <count>
Words = <count>
Lines = <count>
```

**Constraints:** Up to 100000 characters in the file.

**Example:**
```
Given file data.txt contains:
Hello World
This is C programming

Output:
Characters = 33
Words = 6
Lines = 2
```

**Test Cases:**

| # | Given file content | Expected Output |
|---|----------------------|------------------|
| 1 | `Hello World` newline `This is C programming` | `Characters = 33` <br> `Words = 6` <br> `Lines = 2` |
| 2 | `SingleWord` (no trailing newline) | `Characters = 10` <br> `Words = 1` <br> `Lines = 1` |
| 3 | (empty file) | `Characters = 0` <br> `Words = 0` <br> `Lines = 0` |

**Hint:** Count a line even if the file's last line has no trailing `\n` (test 2). A common approach: count `\n` characters, then add 1 if the file is non-empty and does not end with `\n`. Count a word transition whenever you move from whitespace to non-whitespace.

---

## Question 5: Copy One File to Another
**Difficulty:** Easy–Medium

**Problem Description:**
Copy the entire content of `source.txt` into a new file `destination.txt`, overwriting the destination if it exists. Print a confirmation message, or an error message if the source cannot be opened.

**Input Format:** No standard input; `source.txt` already contains data.

**Output Format:** `File copied successfully` or `Error: source file not found`.

**Constraints:** Up to 100000 characters.

**Example:**
```
Given file source.txt contains:
Copy this text.

Output:
File copied successfully

Resulting file destination.txt:
Copy this text.
```

**Test Cases:**

| # | Given source.txt | Expected Output | Resulting destination.txt |
|---|--------------------|------------------|------------------------------|
| 1 | `Copy this text.` | `File copied successfully` | `Copy this text.` |
| 2 | (file does not exist) | `Error: source file not found` | (not created / unchanged) |
| 3 | (empty file) | `File copied successfully` | (empty file) |

**Hint:** Open source as `"r"` and destination as `"w"`, then copy character by character with `fgetc`/`fputc` in a loop until `EOF`.

---

## Question 6: Merge Two Files into a Third File
**Difficulty:** Medium

**Problem Description:**
Read the contents of `file1.txt` and `file2.txt` and write them, one after another (file1's content first, then file2's content), into a new file `merged.txt`. Print the total number of characters written.

**Input Format:** No standard input; both files already contain data.

**Output Format:** `Merged n characters into merged.txt` (where `n` is the total character count written).

**Constraints:** Up to 100000 characters combined.

**Example:**
```
Given file1.txt: Hello (5 characters)
Given file2.txt: World (5 characters)

Output:
Merged 10 characters into merged.txt

Resulting merged.txt:
HelloWorld
```

**Test Cases:**

| # | file1.txt | file2.txt | Expected Output | merged.txt |
|---|-----------|-----------|------------------|------------|
| 1 | `Hello` | `World` | `Merged 10 characters into merged.txt` | `HelloWorld` |
| 2 | (empty) | `OnlyThis` | `Merged 8 characters into merged.txt` | `OnlyThis` |
| 3 | `AB` | (empty) | `Merged 2 characters into merged.txt` | `AB` |

**Hint:** Open `merged.txt` in `"w"` mode once, then copy `file1.txt`'s characters into it, then (without closing merged.txt) copy `file2.txt`'s characters too, counting each character written.

---

## Question 7: Search and Replace a Word in a File
**Difficulty:** Medium–Hard

**Problem Description:**
Read a target word and a replacement word. Read `data.txt`, replace every whole-word occurrence of the target word with the replacement word (word boundaries only — do not replace the target when it is part of a larger word), and write the result back into `data.txt`. Print how many replacements were made.

**Input Format:** Line 1: `target replacement`. `data.txt` already contains text.

**Output Format:** `Replaced n occurrence(s)` (where `n` is the count).

**Constraints:** Up to 10000 characters in the file; words separated by spaces, newlines, or punctuation.

**Example:**
```
Given data.txt contains:
The cat sat on the mat. The cat was happy.

Input:
cat dog

Output:
Replaced 2 occurrence(s)

Resulting data.txt:
The dog sat on the mat. The dog was happy.
```

**Test Cases:**

| # | Given data.txt | Input | Expected Output | Resulting file |
|---|-------------------|-------|------------------|------------------|
| 1 | `The cat sat on the mat. The cat was happy.` | `cat dog` | `Replaced 2 occurrence(s)` | `The dog sat on the mat. The dog was happy.` |
| 2 | `category cat catalog` | `cat dog` | `Replaced 1 occurrence(s)` | `category dog catalog` |
| 3 | `no matches here` | `cat dog` | `Replaced 0 occurrence(s)` | `no matches here` (unchanged) |

*Note on test 2:* `category` and `catalog` contain `cat` as a substring but are not the whole word `cat`, so only the standalone `cat` is replaced.

**Hint:** Read the whole file into a buffer, split conceptually into tokens using boundaries such as spaces and punctuation, and rebuild the output word by word, substituting an exact match. Write the buffer back to `data.txt` using mode `"w"` after processing.

---

## Question 8: Save and Read Structure Records in a Binary File
**Difficulty:** Medium–Hard

**Problem Description:**
Define `struct Student { char name[50]; int roll; float marks; };`. Read `n` student records from standard input and write them all to a binary file `students.dat` using `fwrite`. Then, in the same program, reopen the file and read all records back using `fread`, printing each one to confirm the round trip worked correctly.

**Input Format:** Line 1: `n`. Next `n` lines: `name roll marks`.

**Output Format:** `n` lines, each formatted as `<name> <roll> <marks with 2 decimals>`, read back from the binary file.

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
2
Aarav 101 87.5
Priya 102 91.25

Output:
Aarav 101 87.50
Priya 102 91.25
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `2` / `Aarav 101 87.5` / `Priya 102 91.25` | `Aarav 101 87.50` <br> `Priya 102 91.25` |
| 2 | `1` / `Solo 1 100` | `Solo 1 100.00` |
| 3 | `3` / `A 1 10` / `B 2 20` / `C 3 30` | `A 1 10.00` <br> `B 2 20.00` <br> `C 3 30.00` |

**Hint:** Write: `fwrite(&student, sizeof(struct Student), 1, fp);` for each record, or write the whole array in one call: `fwrite(arr, sizeof(struct Student), n, fp);`. Read back the same way with `fread`. Open with `"wb"` for writing and `"rb"` for reading.

---

## Question 9: Using fseek, ftell and rewind
**Difficulty:** Medium

**Problem Description:**
Given a text file `data.txt`, write a program that: (a) prints the total size of the file in bytes using `fseek`/`ftell`, (b) uses `fseek` to jump directly to the 5th character (index 4) and prints the character found there (or `N/A` if the file is shorter than 5 characters), and (c) uses `rewind` to go back to the start and prints the first character again.

**Input Format:** No standard input; `data.txt` already contains text.

**Output Format:**
```
File size = <bytes> bytes
5th character = <char or N/A>
First character after rewind = <char>
```

**Constraints:** File is non-empty; up to 100000 characters.

**Example:**
```
Given data.txt contains:
Hello World

Output:
File size = 11 bytes
5th character = o
First character after rewind = H
```

**Test Cases:**

| # | Given data.txt | Expected Output |
|---|-------------------|------------------|
| 1 | `Hello World` | `File size = 11 bytes` <br> `5th character = o` <br> `First character after rewind = H` |
| 2 | `Hi` | `File size = 2 bytes` <br> `5th character = N/A` <br> `First character after rewind = H` |
| 3 | `X` | `File size = 1 bytes` <br> `5th character = N/A` <br> `First character after rewind = X` |

**Hint:** `fseek(fp, 0, SEEK_END); long size = ftell(fp);` gives the size. `fseek(fp, 4, SEEK_SET);` moves to the 5th byte (0-indexed offset 4). `rewind(fp);` is equivalent to `fseek(fp, 0, SEEK_SET);`.

---

## Question 10: Mini Project — Student Record System (File-Based)
**Difficulty:** Hard

**Problem Description:**
Build a menu-driven Student Record System that stores records in a binary file `students.dat` using `struct Student { int roll; char name[50]; float marks; };`. Support commands, one per line, until `EXIT`:
- `ADD roll name marks` — add a new record (append to the file)
- `VIEW` — print all records, one per line, as `roll name marks` (marks with 2 decimals)
- `UPDATE roll newMarks` — find the record with that roll number and update its marks; print `Updated` or `Roll not found`
- `DELETE roll` — remove the record with that roll number; print `Deleted` or `Roll not found`
- `EXIT` — stop the program

**Input Format:** A sequence of commands, one per line, ending with `EXIT`.

**Output Format:** Output from `VIEW`, `UPDATE` and `DELETE` commands, in the order the commands were given.

**Constraints:** Up to 1000 records; roll numbers are unique positive integers.

**Example:**
```
Input:
ADD 1 Aarav 78.5
ADD 2 Priya 92.0
VIEW
UPDATE 1 85.0
VIEW
DELETE 2
VIEW
EXIT

Output:
1 Aarav 78.50
2 Priya 92.00
Updated
1 Aarav 85.00
2 Priya 92.00
Deleted
1 Aarav 85.00
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
UPDATE 99 50
DELETE 99
EXIT
Output:
Roll not found
Roll not found
```
Test 3:
```
Input:
ADD 5 Test 60
DELETE 5
VIEW
EXIT
Output:
Deleted
(no output for VIEW, since the file is now empty)
```

**Hint:** For `UPDATE` and `DELETE`, since binary files don't easily support removing a record from the middle, read all records into memory (an array), make the change, then rewrite the entire file from scratch using mode `"wb"`. This is simpler and safer than trying to modify the file in place.

---

## Module 13 Challenge Questions (Optional)

1. **Line Numbering:** Read a text file and write a new file where every line is prefixed with its line number, like `1: <line>`. (Example: 3-line file → each line gets `1:`, `2:`, `3:` prefixes)
2. **Remove Blank Lines:** Read a file and write a new version with all empty lines removed. (Example: 5 lines with 2 blank → 3 non-blank lines remain)
3. **CSV Parser:** Read a simple CSV file (comma-separated, no quoted commas) and print it as a formatted table, aligning columns. (Example: `name,age` / `Sam,21` → a neatly aligned two-column table)

---
*End of Module 13. Next: Module 14, Preprocessor, Storage Classes and Bit Manipulation.*
