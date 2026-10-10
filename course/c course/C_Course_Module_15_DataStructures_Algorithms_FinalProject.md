# C Programming Course: Zero to Advanced

## Module 15: Data Structures, Algorithms and Final Project
**Level:** Advanced | **Questions:** 10

**Topics covered:** singly linked lists, stacks, queues, sorting algorithms, binary search, binary search trees, and a final menu-driven project combining structures and file handling.

**Before you start:**
- A linked list node is a `struct` containing data and a pointer to the next node of the same type: `struct Node { int data; struct Node *next; };`
- Always keep a `head` pointer to the first node; a list is empty when `head == NULL`.
- Stack: Last In, First Out (LIFO). Queue: First In, First Out (FIFO).
- For recursive structures like a BST, remember that `NULL` naturally represents "no subtree here" and is usually the base case.

---

## Question 1: Singly Linked List — Insert, Delete, Display
**Difficulty:** Medium

**Problem Description:**
Implement a singly linked list of integers supporting these commands, one per line, until `EXIT`:
- `INSERT_END value` — insert at the end of the list
- `INSERT_FRONT value` — insert at the front
- `DELETE value` — delete the first node with that value; print `Deleted` or `Not found`
- `DISPLAY` — print all values space-separated, or `Empty list` if there are none
- `EXIT` — stop

**Input Format:** A sequence of commands ending with `EXIT`.

**Output Format:** Output from `DELETE` and `DISPLAY` commands, in order.

**Constraints:** Up to 1000 operations.

**Example:**
```
Input:
INSERT_END 10
INSERT_END 20
INSERT_FRONT 5
DISPLAY
DELETE 20
DISPLAY
EXIT

Output:
5 10 20
Deleted
5 10
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
DELETE 99
DISPLAY
EXIT
Output:
Not found
Empty list
```
Test 3:
```
Input:
INSERT_END 1
DELETE 1
DISPLAY
EXIT
Output:
Deleted
Empty list
```

**Hint:** For `DELETE`, handle three cases separately: the list is empty, the node to delete is the head, or the node is somewhere in the middle/end (requires tracking the previous node so you can relink `prev->next`).

---

## Question 2: Reverse a Linked List
**Difficulty:** Medium

**Problem Description:**
Read `n` integers, build a singly linked list from them in the given order, reverse the list in place (do not build a new list), and print the reversed list.

**Input Format:** Line 1: `n`. Line 2: `n` integers.

**Output Format:** The reversed list, space-separated. If `n = 0`, print `Empty list`.

**Constraints:** 0 ≤ n ≤ 1000

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
| 2 | `0` / (empty) | `Empty list` |
| 3 | `1` / `9` | `9` |

**Hint:** Use three pointers `prev = NULL`, `curr = head`, `next`. Repeat: save `next = curr->next`, then `curr->next = prev`, then `prev = curr`, then `curr = next`. When the loop ends, `prev` is the new head.

---

## Question 3: Stack Using an Array and Using a Linked List
**Difficulty:** Medium

**Problem Description:**
Implement a stack of integers **twice**: once using a fixed-size array (with a `top` index and a maximum capacity of 100, reporting overflow), and once using a linked list (no fixed capacity). Support commands, one per line, until `EXIT`:
- `PUSH value`
- `POP` — print the popped value, or `Stack Underflow` if empty
- `PEEK` — print the top value, or `Stack is empty`
- `EXIT`

Run the exact same sequence of commands through both implementations and confirm they produce identical output (submit one implementation; the point is that both approaches give the same behavior).

**Input Format:** A sequence of commands ending with `EXIT`.

**Output Format:** Output from `PUSH` (only on overflow), `POP` and `PEEK`, in order.

**Constraints:** Up to 1000 operations; array version capacity is 100.

**Example:**
```
Input:
PUSH 10
PUSH 20
PEEK
POP
POP
POP
EXIT

Output:
20
20
10
Stack Underflow
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
PEEK
EXIT
Output:
Stack is empty
```
Test 3:
```
Input:
PUSH 1
PUSH 2
PUSH 3
POP
PEEK
EXIT
Output:
3
2
```

**Hint:** Array version: `push` checks `if (top == capacity - 1) printf("Stack Overflow\n");` else `arr[++top] = value;`. Linked-list version: `push` simply inserts a new node at the head, and `pop` removes the head node.

---

## Question 4: Balanced Parentheses Using a Stack
**Difficulty:** Medium

**Problem Description:**
Read a string containing only the characters `(`, `)`, `{`, `}`, `[`, `]`. Use a stack to check whether the brackets are balanced: every opening bracket must have a matching closing bracket of the same type, in the correct order.

**Input Format:** A single line containing only bracket characters.

**Output Format:** `Balanced` or `Not Balanced`

**Constraints:** 1 ≤ length ≤ 1000

**Example:**
```
Input:
{[()()]}

Output:
Balanced
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `{[()()]}` | `Balanced` |
| 2 | `{[(])}` | `Not Balanced` |
| 3 | `(((` | `Not Balanced` |

**Hint:** Push every opening bracket. On a closing bracket, pop and check it matches the corresponding opening type; if the stack is empty when you need to pop, or a mismatch occurs, it is unbalanced. At the end, the stack must also be empty (test 3 fails this final check).

---

## Question 5: Circular Queue Implementation
**Difficulty:** Medium–Hard

**Problem Description:**
Implement a circular queue of integers using a fixed-size array of capacity 5. Support commands, one per line, until `EXIT`:
- `ENQUEUE value` — add to the rear; print `Queue Full` if it is already at capacity
- `DEQUEUE` — remove from the front, print the removed value, or `Queue Empty`
- `DISPLAY` — print all current elements from front to rear, space-separated, or `Queue Empty`
- `EXIT`

**Input Format:** A sequence of commands ending with `EXIT`.

**Output Format:** Output from `ENQUEUE` (only on full), `DEQUEUE` and `DISPLAY`, in order.

**Constraints:** Capacity is fixed at 5.

**Example:**
```
Input:
ENQUEUE 1
ENQUEUE 2
ENQUEUE 3
DEQUEUE
ENQUEUE 4
DISPLAY
EXIT

Output:
1
2 3 4
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
ENQUEUE 1
ENQUEUE 2
ENQUEUE 3
ENQUEUE 4
ENQUEUE 5
ENQUEUE 6
EXIT
Output:
Queue Full
```
Test 3:
```
Input:
DEQUEUE
DISPLAY
EXIT
Output:
Queue Empty
Queue Empty
```

**Hint:** Use `front`, `rear` and `count` (not just front/rear) to distinguish "full" from "empty" cleanly. Advance indices with wraparound: `rear = (rear + 1) % capacity;`. This question shows why a **circular** queue is needed — a plain array queue would waste the freed-up space after dequeues (test 1 shows a dequeue making room for a 4th enqueue even though the array only holds 5 slots).

---

## Question 6: Bubble, Selection and Insertion Sort
**Difficulty:** Medium

**Problem Description:**
Read `n` integers into an array. Implement and run all three sorts — bubble sort, selection sort and insertion sort — each on a **fresh copy** of the original array, and print the sorted result three times (they should all match).

**Input Format:** Line 1: `n`. Line 2: `n` integers.

**Output Format:**
```
Bubble Sort: <sorted array>
Selection Sort: <sorted array>
Insertion Sort: <sorted array>
```

**Constraints:** 1 ≤ n ≤ 1000

**Example:**
```
Input:
5
5 2 9 1 5

Output:
Bubble Sort: 1 2 5 5 9
Selection Sort: 1 2 5 5 9
Insertion Sort: 1 2 5 5 9
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `5` / `5 2 9 1 5` | all three lines: `1 2 5 5 9` |
| 2 | `1` / `7` | all three lines: `7` |
| 3 | `4` / `4 3 2 1` | all three lines: `1 2 3 4` |

**Hint:** Copy the original array into three separate arrays before sorting, since sorting is done in place and would otherwise affect the input for the next algorithm.

---

## Question 7: Quick Sort or Merge Sort
**Difficulty:** Medium–Hard

**Problem Description:**
Read `n` integers into an array and sort it using **either** quick sort or merge sort (your choice), implemented recursively. Print the sorted array.

**Input Format:** Line 1: `n`. Line 2: `n` integers.

**Output Format:** The sorted array, space-separated.

**Constraints:** 1 ≤ n ≤ 100000

**Example:**
```
Input:
6
38 27 43 3 9 82

Output:
3 9 27 38 43 82
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `6` / `38 27 43 3 9 82` | `3 9 27 38 43 82` |
| 2 | `1` / `5` | `5` |
| 3 | `5` / `5 5 5 5 5` | `5 5 5 5 5` |

**Hint:** Merge sort: split into two halves, sort each recursively, merge (reuse the merge logic from Module 7, Question 9). Quick sort: pick a pivot, partition the array around it, then recursively sort each side. Merge sort is more predictable for large `n` (guaranteed O(n log n)); quick sort's worst case is O(n²) on already-sorted or adversarial input.

---

## Question 8: Binary Search (Iterative and Recursive)
**Difficulty:** Medium

**Problem Description:**
Read a **sorted** array of `n` integers and a target value. Implement binary search in two ways — an iterative version and a recursive version — and print the index found by each (0-indexed). Both should return `-1` if not found, and should agree with each other.

**Input Format:** Line 1: `n`. Line 2: `n` sorted integers. Line 3: `target`.

**Output Format:**
```
Iterative: <index>
Recursive: <index>
```

**Constraints:** 1 ≤ n ≤ 100000, array strictly sorted ascending.

**Example:**
```
Input:
6
2 4 6 8 10 12
8

Output:
Iterative: 3
Recursive: 3
```

**Test Cases:**

| # | Input | Expected Output |
|---|-------|-----------------|
| 1 | `6` / `2 4 6 8 10 12` / `8` | `Iterative: 3` <br> `Recursive: 3` |
| 2 | `4` / `1 2 3 4` / `10` | `Iterative: -1` <br> `Recursive: -1` |
| 3 | `1` / `5` / `5` | `Iterative: 0` <br> `Recursive: 0` |

**Hint:** Both versions repeatedly compare the target against the middle element and discard half the search space: `mid = low + (high - low) / 2;` (this form avoids potential overflow compared to `(low + high) / 2` on very large arrays).

---

## Question 9: Binary Search Tree — Insert, Search, Inorder Traversal
**Difficulty:** Medium–Hard

**Problem Description:**
Implement a Binary Search Tree (BST) of integers. Support commands, one per line, until `EXIT`:
- `INSERT value` — insert into the BST (ignore duplicates silently — do not insert them again)
- `SEARCH value` — print `Found` or `Not Found`
- `INORDER` — print all values via inorder traversal (which visits them in sorted order), space-separated, or `Empty tree`
- `EXIT`

**Input Format:** A sequence of commands ending with `EXIT`.

**Output Format:** Output from `SEARCH` and `INORDER`, in order.

**Constraints:** Up to 1000 operations.

**Example:**
```
Input:
INSERT 50
INSERT 30
INSERT 70
INSERT 20
INORDER
SEARCH 30
SEARCH 99
EXIT

Output:
20 30 50 70
Found
Not Found
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
SEARCH 5
INORDER
EXIT
Output:
Not Found
Empty tree
```
Test 3:
```
Input:
INSERT 10
INSERT 10
INORDER
EXIT
Output:
10
```

**Hint:** In `struct Node { int data; struct Node *left, *right; };`, `insert` recursively compares the new value with the current node: smaller goes left, larger goes right, equal is ignored. `inorder` recursively visits left, prints the node, visits right — this visiting order is exactly what produces sorted output.

---

## Question 10: Final Project — Bank Management System
**Difficulty:** Hard

**Problem Description:**
Build a menu-driven Bank Management System combining structures and file handling. Store accounts in a binary file `accounts.dat` using `struct Account { int accNo; char name[50]; double balance; };`. Support commands, one per line, until `EXIT`:
- `CREATE accNo name initialBalance` — create a new account; print `Account created` or `Account already exists`
- `DEPOSIT accNo amount` — add to balance; print `New balance: <value>` (2 decimals) or `Account not found`
- `WITHDRAW accNo amount` — subtract from balance if sufficient funds; print `New balance: <value>`, or `Insufficient funds`, or `Account not found`
- `BALANCE accNo` — print `Balance: <value>` or `Account not found`
- `TRANSFER fromAcc toAcc amount` — withdraw from one account and deposit into another, only if both exist and funds are sufficient; print `Transfer successful`, or the specific failure reason
- `LIST` — print all accounts as `accNo name balance` (2 decimals), ordered by account number ascending, or `No accounts`
- `EXIT`

**Input Format:** A sequence of commands, one per line, ending with `EXIT`.

**Output Format:** Output from every command except `CREATE` on success and `EXIT`, in the order given. (`CREATE` does print its own message too — see the command list above.)

**Constraints:** Account numbers are unique positive integers; amounts are positive with up to 2 decimal places; up to 1000 accounts.

**Example:**
```
Input:
CREATE 101 Aarav 5000
CREATE 102 Priya 3000
DEPOSIT 101 1000
WITHDRAW 102 5000
TRANSFER 101 102 2000
BALANCE 101
BALANCE 102
LIST
EXIT

Output:
Account created
Account created
New balance: 6000.00
Insufficient funds
Transfer successful
Balance: 4000.00
Balance: 5000.00
101 Aarav 4000.00
102 Priya 5000.00
```

**Test Cases:**

Test 1:
```
(as example above)
```
Test 2:
```
Input:
DEPOSIT 999 100
BALANCE 999
CREATE 1 A 100
CREATE 1 B 200
EXIT
Output:
Account not found
Account not found
Account created
Account already exists
```
Test 3:
```
Input:
CREATE 1 Solo 1000
TRANSFER 1 2 500
TRANSFER 1 1 100
LIST
EXIT
Output:
Account created
Account not found
Transfer successful
1 Solo 1000.00
```

*Note on test 3:* `TRANSFER 1 1 100` transfers an account to itself — withdrawing then depositing the same amount back — so the balance is unchanged at 1000.00.

**Hint:** As in Module 13 Question 10, the simplest reliable approach is to load all accounts into memory (an array or a sorted structure) at the start, perform every operation on that in-memory copy, and rewrite the entire `accounts.dat` file after each change (or once at the very end, before `EXIT`, if your grading only checks the final file state). Keep the accounts sorted by `accNo` (or sort just before `LIST`) to satisfy the ascending-order requirement.

---

## Module 15 Challenge Questions (Optional — Capstone Level)

1. **Detect a Cycle in a Linked List:** Given a linked list that may contain a cycle, detect whether one exists using Floyd's cycle detection (slow/fast pointer) algorithm, without extra memory. (Example: a list where the last node points back to node 2 → `Cycle detected`)
2. **Min-Heap Using an Array:** Implement a min-heap supporting `insert` and `extractMin`, maintaining the heap property after each operation. (Example: inserting `5, 3, 8, 1` then extracting twice → `1`, then `3`)
3. **Graph BFS/DFS:** Represent a small graph using an adjacency list (array of linked lists) and implement both breadth-first and depth-first traversal starting from a given node. (Example: a graph with edges `1-2, 1-3, 2-4` starting at `1` → BFS: `1 2 3 4`)

---
*End of Module 15. End of Course.*

## Course Complete
You have now covered all 15 modules and 150 questions, from `printf("Hello, World!")` to a full file-based Bank Management System. A natural next step from here is Data Structures & Algorithms in more depth (trees, graphs, dynamic programming), or moving into C++ to build on these fundamentals with OOP concepts.
