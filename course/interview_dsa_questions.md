# Interview DSA Course - Module 1: Arrays

---

## Problem 1: The Extreme Temperatures
**Difficulty:** Easy  
**Topic:** Arrays  
**Asked In:** Amazon, Google, Adobe, Cisco  

### Problem Description
A meteorological station records the temperature of a city every hour for a specific day. You are given an array of integers `temperatures` representing these recordings. Your task is to identify the **highest** and **lowest** temperatures recorded during that day to help scientists analyze the climate variability.

You must return these two values.

**Constraints:**
- `1 <= temperatures.length <= 10^5`
- `-1000 <= temperatures[i] <= 1000`
- The time complexity must be O(N).

### Input Format
- An integer `n`, representing the number of temperature recordings.
- An array of `n` integers `temperatures`.

### Output Format
- Two integers separated by a space: the maximum temperature followed by the minimum temperature.

### Examples

**Example 1:**
```text
Input:
5
23 12 35 12 40

Output:
40 12

Explanation:
The temperatures recorded are [23, 12, 35, 12, 40].
The highest temperature is 40.
The lowest temperature is 12.
```

**Example 2:**
```text
Input:
1
-5

Output:
-5 -5

Explanation:
Only one recording exists, so it is both the maximum and minimum.
```

### Test Cases
```text
Test Case 1 (Normal):
Input:
6
10 50 30 20 60 40
Output:
60 10

Test Case 2 (Negative Numbers):
Input:
5
-10 -5 -20 -1 -8
Output:
-1 -20

Test Case 3 (All Identical):
Input:
4
7 7 7 7
Output:
7 7

Test Case 4 (Single Element):
Input:
1
100
Output:
100 100

Test Case 5 (Large Input):
Input:
10
1 2 3 4 5 6 7 8 9 10
Output:
10 1

Test Case 6 (Mixed Signs):
Input:
5
-10 10 0 -20 20
Output:
20 -20
```

### Solution Expectation
- **Time Complexity:** O(N) - Single pass traversal.
- **Space Complexity:** O(1) - No extra space required.
- **Approach:** Initialize `min_val` to infinity and `max_val` to negative infinity (or the first element). Iterate through the array once, updating `min_val` and `max_val` as you encounter smaller or larger numbers respectively.

---

## Problem 2: The Reversed Data Stream
**Difficulty:** Easy  
**Topic:** Arrays  
**Asked In:** Infosys, Moonfrog Labs  

### Problem Description
A satellite sends data packets to earth as an array of integers. Due to a transmission protocol error, the packets are received in the exact reverse order of their generation. The ground station needs to process them in the original chronological order.

Given the array `received_data`, your task is to verify the system by reversing the array strictly **in-place** (without creating a new array) to restore the original order.

**Constraints:**
- `1 <= received_data.length <= 10^4`
- `-10^9 <= received_data[i] <= 10^9`

### Input Format
- An integer `n`, the size of the array.
- An array `received_data` of size `n`.

### Output Format
- The modified array elements separated by spaces.

### Examples

**Example 1:**
```text
Input:
4
1 2 3 4

Output:
4 3 2 1

Explanation:
The array [1, 2, 3, 4] reversed becomes [4, 3, 2, 1].
```

**Example 2:**
```text
Input:
3
-1 -2 -3

Output:
-3 -2 -1
```

### Test Cases
```text
Test Case 1 (Even Length):
Input:
4
10 20 30 40
Output:
40 30 20 10

Test Case 2 (Odd Length):
Input:
3
5 15 25
Output:
25 15 5

Test Case 3 (Single Element):
Input:
1
99
Output:
99

Test Case 4 (Two Elements):
Input:
2
0 1
Output:
1 0

Test Case 5 (All Zeros):
Input:
5
0 0 0 0 0
Output:
0 0 0 0 0
```

### Solution Expectation
- **Time Complexity:** O(N) - Iterate through half the array.
- **Space Complexity:** O(1) - Required In-place.
- **Approach:** Use a Two-Pointer approach. Set one pointer `left` at index 0 and `right` at index `n-1`. Swap the elements at `left` and `right`, then increment `left` and decrement `right` until they meet.

---

## Problem 3: The Most Profitable Timeframe
**Difficulty:** Medium  
**Topic:** Arrays  
**Asked In:** Microsoft, Facebook, LinkedIn  

### Problem Description
You are a financial analyst monitoring the hourly performance of a volatile stock. You have an array `pnl` (Profit and Loss) where each element represents the net profit (positive) or loss (negative) recorded in a specific hour.

Your goal is to find a contiguous sequence of hours (a subarray) that produces the **maximum possible total profit**. Even if all hours show a loss, you must identify the timeframe that results in the least loss (single least negative hour).

**Constraints:**
- `1 <= pnl.length <= 10^5`
- `-10^4 <= pnl[i] <= 10^4`

### Input Format
- An integer `n`.
- An array `pnl` of integers.

### Output Format
- A single integer representing the maximum subarray sum.

### Examples

**Example 1:**
```text
Input:
8
-2 -3 4 -1 -2 1 5 -3

Output:
7

Explanation:
The contiguous subarray [4, -1, -2, 1, 5] gives the sum = 4 - 1 - 2 + 1 + 5 = 7.
This is the highest possible sum.
```

**Example 2:**
```text
Input:
4
-10 -2 -3 -5

Output:
-2

Explanation:
Since all numbers are negative, picking the single element -2 gives the maximum sum.
```

### Test Cases
```text
Test Case 1 (Mixed):
Input:
5
1 2 3 -2 5
Output:
9

Test Case 2 (All Negative):
Input:
3
-5 -9 -1
Output:
-1

Test Case 3 (All Positive):
Input:
4
10 20 30 40
Output:
100

Test Case 4 (Oscillating):
Input:
6
5 -4 6 -3 4 -1
Output:
7

Test Case 5 (Large Negative Dip):
Input:
5
10 20 -100 20 10
Output:
30
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Use **Kadane’s Algorithm**. Maintain a `current_sum` and `max_sum`. Iterate through the array, adding the current number to `current_sum`. If `current_sum` exceeds `max_sum`, update `max_sum`. If `current_sum` becomes negative, reset it to 0 (unless all numbers are negative, in which case handle carefully by taking the max element).

---

## Problem 4: The Duplicate ID Detection
**Difficulty:** Easy  
**Topic:** Arrays, Hashing  
**Asked In:** Amazon, Apple  

### Problem Description
In a secure database system, every transaction is assigned a unique integer ID. However, due to a system glitch, some IDs might have been generated more than once.

You are given an array `transaction_ids`. Write a function to check if **any** ID appears at least twice in the array. Return `true` if any duplicate exists, otherwise return `false`.

**Constraints:**
- `1 <= transaction_ids.length <= 10^5`
- `-10^9 <= transaction_ids[i] <= 10^9`

### Input Format
- An integer `n`.
- An array `transaction_ids`.

### Output Format
- String "true" or "false".

### Examples

**Example 1:**
```text
Input:
4
1 2 3 1

Output:
true

Explanation:
ID '1' appears twice.
```

**Example 2:**
```text
Input:
4
1 2 3 4

Output:
false

Explanation:
All IDs are distinct.
```

### Test Cases
```text
Test Case 1 (Duplicate Present):
Input:
5
10 20 30 40 10
Output:
true

Test Case 2 (Distinct):
Input:
3
5 10 15
Output:
false

Test Case 3 (Multiple Duplicates):
Input:
6
1 1 2 2 3 3
Output:
true

Test Case 4 (Single Element):
Input:
1
100
Output:
false

Test Case 5 (Large Input):
Input:
5
1 2 3 4 1
Output:
true
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)
- **Approach:** Use a **HashSet** to store elements as you iterate. For each element, check if it exists in the set. If yes, return true. If loop finishes, return false. Sorting is O(N log N) which is also acceptable but O(N) is preferred.

---

## Problem 5: The Gift Hamper Fairness
**Difficulty:** Easy  
**Topic:** Arrays, Sorting  
**Asked In:** Amazon  

### Problem Description
You are organizing a contest and have `n` different gift hampers, each with a specific value (price). You need to select `m` hampers to give to `m` winners.

To be as fair as possible, you want to choose the `m` hampers such that the difference between the **most expensive** hamper and the **least expensive** hamper in your chosen subset is **minimized**.

Return this minimum difference.

**Constraints:**
- `1 <= m <= n <= 10^5`
- `0 <= hamper_values[i] <= 10^9`

### Input Format
- An integer `n` (total hampers).
- An integer `m` (winners).
- An array `hamper_values` of size `n`.

### Output Format
- A single integer representing the minimum difference.

### Examples

**Example 1:**
```text
Input:
8 5
3 4 1 9 56 7 9 12

Output:
6

Explanation:
Sorted hampers: [1, 3, 4, 7, 9, 9, 12, 56]
We need to pick 5 hampers.
Possible subsets of size 5:
[1, 3, 4, 7, 9] -> Diff = 9 - 1 = 8
[3, 4, 7, 9, 9] -> Diff = 9 - 3 = 6  <-- Min
[4, 7, 9, 9, 12] -> Diff = 12 - 4 = 8
...
The minimum difference is 6.
```

**Example 2:**
```text
Input:
5 3
10 20 30 100 101

Output:
20

Explanation:
Sorted: [10, 20, 30, 100, 101]
Subset [10, 20, 30] -> Diff = 20.
Subset [30, 100, 101] -> Diff = 71.
Min is 20.
```

### Test Cases
```text
Test Case 1 (m = n):
Input:
4 4
1 10 20 30
Output:
29

Test Case 2 (m = 1):
Input:
5 1
10 20 30 40 50
Output:
0

Test Case 3 (Unsorted Large Gap):
Input:
6 3
100 2 4 105 3 1
Output:
2
(Sorted: 1 2 3 4 100 105. Subset [1,2,3] -> diff 2)

Test Case 4 (All Identical):
Input:
5 3
10 10 10 10 10
Output:
0

Test Case 5 (Large Input):
Input:
5 3
1 100 200 300 400
Output:
199
(Subset [100, 200, 300] is wrong, [1, 100, 200] is 199?? No.
Sorted: 1, 100, 200, 300, 400.
Windows:
[1, 100, 200] -> 199
[100, 200, 300] -> 200
[200, 300, 400] -> 200.
Min is 199.
```

### Solution Expectation
- **Time Complexity:** O(N log N) - Due to sorting.
- **Space Complexity:** O(1)
- **Approach:** 
  1. Sort the array.
  2. The subset of size `m` with minimal difference must be a contiguous subarray in the sorted array.
  3. Iterate with a sliding window of size `m` (from `i = 0` to `n - m`).
  4. Calculate `diff = arr[i + m - 1] - arr[i]`.
  5. Track the minimum `diff` found.

---

## Problem 6: The Circular Library Search
**Difficulty:** Medium  
**Topic:** Arrays, Binary Search  
**Asked In:** Microsoft, Google, Adobe, Amazon  

### Problem Description
A digital library stores book IDs in a sorted array in ascending order. However, due to a database reorganization, the storage array was effectively "rotated" at some unknown pivot index. 

(For example, `[0, 1, 2, 4, 5, 6, 7]` might become `[4, 5, 6, 7, 0, 1, 2]`).

You are given this rotated sorted array `book_ids` and a specific `target_id`. Your task is to find the index of `target_id` in the array. If the ID is not found, return `-1`.

You must implement an algorithm with **O(log N)** time complexity.

**Constraints:**
- `1 <= book_ids.length <= 5000`
- `-10^4 <= book_ids[i], target_id <= 10^4`
- All IDs are unique.

### Input Format
- An integer `n`.
- An array `book_ids` of size `n` (rotated sorted).
- An integer `target_id`.

### Output Format
- A single integer index of the target, or -1.

### Examples

**Example 1:**
```text
Input:
7
4 5 6 7 0 1 2
0

Output:
4

Explanation:
The target 0 is found at index 4.
```

**Example 2:**
```text
Input:
7
4 5 6 7 0 1 2
3

Output:
-1

Explanation:
The target 3 is not present in the array.
```

### Test Cases
```text
Test Case 1 (Target on Left Side):
Input:
5
5 1 2 3 4
5
Output:
0

Test Case 2 (Target on Right Side):
Input:
6
6 7 1 2 3 4
3
Output:
4

Test Case 3 (Not Rotated):
Input:
3
1 2 3
2
Output:
1

Test Case 4 (Single Element Found):
Input:
1
10
10
Output:
0

Test Case 5 (Single Element Not Found):
Input:
1
10
5
Output:
-1

Test Case 6 (Pivot Element):
Input:
5
3 1
1
Output:
1
```

### Solution Expectation
- **Time Complexity:** O(log N)
- **Space Complexity:** O(1)
- **Approach:** Modified Binary Search.
  1. Determine `mid`. 
  2. Check if `nums[mid] == target`.
  3. Identify which half (left `[low...mid]` or right `[mid...high]`) is sorted.
  4. If left is sorted, check if target lies within that range. If yes, move `high = mid - 1`, else `low = mid + 1`.
  5. If right is sorted, check if target lies there.

---

## Problem 7: The Lexicographical Signal
**Difficulty:** Medium  
**Topic:** Arrays  
**Asked In:** Uber, Goldman Sachs, Adobe  

### Problem Description
A secret signal consisting of numeric digits is encoded as an array of integers. To prevent unauthorized access, the protocol requires changing the signal to the **next lexicographically greater permutation** of its numbers.

If the current signal is already the largest possible permutation (e.g., `[3, 2, 1]`), it must be rearranged to the lowest possible order (i.e., sorted in ascending order `[1, 2, 3]`).

You must perform this rearrangement **in-place**.

**Constraints:**
- `1 <= signal.length <= 100`
- `0 <= signal[i] <= 100`

### Input Format
- An integer `n`.
- An array `signal` of size `n`.

### Output Format
- The rearranged signal array separated by spaces.

### Examples

**Example 1:**
```text
Input:
3
1 2 3

Output:
1 3 2

Explanation:
The permutations of [1,2,3] in order are:
[1,2,3], [1,3,2], [2,1,3]...
The next one after [1,2,3] is [1,3,2].
```

**Example 2:**
```text
Input:
3
3 2 1

Output:
1 2 3

Explanation:
[3,2,1] is the largest permutation. Reset to smallest [1,2,3].
```

**Example 3:**
```text
Input:
3
1 1 5

Output:
1 5 1
```

### Test Cases
```text
Test Case 1 (Standard):
Input:
4
1 3 5 4
Output:
1 4 3 5
(Swap 3 and 4, then reverse suffix)

Test Case 2 (Ascending):
Input:
3
1 2 3
Output:
1 3 2

Test Case 3 (Descending - Last Permutation):
Input:
4
4 3 2 1
Output:
1 2 3 4

Test Case 4 (Single Element):
Input:
1
10
Output:
10

Test Case 5 (Middle Swap Needed):
Input:
5
1 5 8 4 7 6 5 3 1
(Too long for example? Use shorter: 1 5 1) -> 5 1 1
Input:
3
1 5 1
Output:
5 1 1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:**
  1. Iterate from right to find first index `i` such that `arr[i] < arr[i+1]`.
  2. If no such `i`, reverse whole array.
  3. Else, iterate from right to find first index `j` greater than `arr[i]`.
  4. Swap `arr[i]` and `arr[j]`.
  5. Reverse the sub-array from `i+1` to end.

---

## Problem 8: Maximum Profit from Bitcoin Trading
**Difficulty:** Easy  
**Topic:** Arrays, Dynamic Programming  
**Asked In:** Amazon, D-E-Shaw, Flipkart  

### Problem Description
You have historical price data of Bitcoin for a series of days stored in an array `prices`. 
You are allowed to complete **at most one transaction** (i.e., buy one unit of Bitcoin and sell it later). Note that you cannot sell before you buy.
Find the maximum profit you can achieve. If no profit is possible (prices only go down), return 0.

**Constraints:**
- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

### Input Format
- An integer `n`.
- An array `prices` of size `n`.

### Output Format
- A single integer representing maximum profit.

### Examples

**Example 1:**
```text
Input:
6
7 1 5 3 6 4

Output:
5

Explanation:
Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
Note that 7-1 = 6 is not allowed because you must buy before you sell.
```

**Example 2:**
```text
Input:
5
7 6 4 3 1

Output:
0

Explanation:
Prices are strictly decreasing. Any transaction results in a loss or 0 profit.
```

### Test Cases
```text
Test Case 1 (Normal):
Input:
5
1 2 3 4 5
Output:
4
(Buy 1 Sell 5)

Test Case 2 (Large Dip Middle):
Input:
5
7 1 5 3 6
Output:
5

Test Case 3 (Two Equal Mins):
Input:
6
3 3 5 0 0 3
Output:
3
(Buy 0 Sell 3)

Test Case 4 (Single Element):
Input:
1
100
Output:
0

Test Case 5 (Large Peak Early):
Input:
5
2 10 1 5 3
Output:
8
(Buy 2 Sell 10)
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Maintain `min_price` seen so far. For each price, calculate `current_profit = price - min_price`. Update `max_profit` if `current_profit` is higher.

---

## Problem 9: The Corrupted Inventory List
**Difficulty:** Medium  
**Topic:** Arrays, Math  
**Asked In:** Amazon, Microsoft  

### Problem Description
You are an inventory manager. Your inventory list contains `n` items labeled from `1` to `n`. However, due to a clerical error, one specific item ID appears **twice** in the list, and one item ID is **missing** completely.

You are given an unsorted array `inventory` of size `n` containing these IDs. Your task is to find the repeating number and the missing number.

**Constraints:**
- `2 <= inventory.length <= 10^5`
- `1 <= inventory[i] <= n`

### Input Format
- An integer `n`.
- An array `inventory` of size `n`.

### Output Format
- Two integers separated by space: `repeating_number` `missing_number`.

### Examples

**Example 1:**
```text
Input:
3
3 1 3

Output:
3 2

Explanation:
The input array is [3, 1, 3]. It should be [1, 2, 3].
Repeating: 3. Missing: 2.
```

**Example 2:**
```text
Input:
4
4 3 6 2 1 1 (Wait, input length must match n)
Input:
5
1 2 2 4 5

Output:
2 3
```

### Test Cases
```text
Test Case 1 (Swapped adjacent):
Input:
4
1 2 2 4
Output:
2 3

Test Case 2 (Swapped distant):
Input:
5
5 1 4 4 2
Output:
4 3

Test Case 3 (Smallest n):
Input:
2
1 1
Output:
1 2

Test Case 4 (Last Missing):
Input:
3
1 1 2
Output:
1 3

Test Case 5 (First Missing):
Input:
3
2 2 3
Output:
2 1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) (Preferred) or O(N).
- **Approach:** 
  1. (O(N) Space): Use a frequency array/hash map.
  2. (O(1) Space): Use math equations.
     Sum(Actual) - Sum(Expected) = X - Y
     Sum(Squares Actual) - Sum(Squares Expected) = X^2 - Y^2
     Solve for X and Y.
  3. (O(1) Space): Index mapping (negate values at index).

---

## Problem 10: The K-th Highest Ranked Gamer
**Difficulty:** Medium  
**Topic:** Arrays, Sorting, Heap  
**Asked In:** Amazon, Microsoft, Adobe  

### Problem Description
In a massive online tournament, player scores are stored in an array. You want to identify the `k`-th highest score on the leaderboard. Note that the `k`-th highest score is the score that would be at index `k-1` if the array were sorted in descending order.

You must solve this problem without fully sorting the array if possible (or understand the sorting trade-off).

**Constraints:**
- `1 <= k <= scores.length <= 10^5`
- `-10^4 <= scores[i] <= 10^4`

### Input Format
- An integer `n`.
- An array `scores` of size `n`.
- An integer `k`.

### Output Format
- A single integer representing the k-th largest element.

### Examples

**Example 1:**
```text
Input:
6
3 2 1 5 6 4
2

Output:
5

Explanation:
Sorted descending: [6, 5, 4, 3, 2, 1].
2nd largest is 5.
```

**Example 2:**
```text
Input:
9
3 2 3 1 2 4 5 5 6
4

Output:
4

Explanation:
Sorted descending: [6, 5, 5, 4, 3, 3, 2, 2, 1].
4th largest is 4.
```

### Test Cases
```text
Test Case 1 (k = 1):
Input:
5
10 20 50 30 40
1
Output:
50

Test Case 2 (k = n):
Input:
5
10 20 50 30 40
5
Output:
10

Test Case 3 (All Identical):
Input:
4
9 9 9 9
2
Output:
9

Test Case 4 (Negative scores):
Input:
3
-1 -5 -2
2
Output:
-2

Test Case 5 (Large k):
Input:
6
1 2 3 4 5 6
6
Output:
1
```

### Solution Expectation
- **Time Complexity:** O(N log k) using Min-Heap, or O(N) average using QuickSelect. O(N log N) using Sort is naive.
- **Space Complexity:** O(k) for Heap or O(1) for Sort/QuickSelect.
- **Approach:**
  1. **Min-Heap**: Maintain a heap of size k. If element > heap.top, pop and push. Top is answer.
  2. **QuickSelect**: Partition array like QuickSort around pivot. Recurse into side containing k.

---

## Problem 11: The Water Containment Challenge
**Difficulty:** Hard  
**Topic:** Arrays  
**Asked In:** Samsung, Google, Amazon  

### Problem Description
You are given an array of non-negative integers representing an elevation map where the width of each bar is 1. Your task is to calculate how much water it can trap after raining.

Imagine these bars are like walls. When it rains, water fills the valid gaps between the walls.

**Constraints:**
- `1 <= height.length <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

### Input Format
- An integer `n`.
- An array `height` of size `n`.

### Output Format
- A single integer representing the total water trapped.

### Examples

**Example 1:**
```text
Input:
12
0 1 0 2 1 0 1 3 2 1 2 1

Output:
6

Explanation:
The elevation map corresponds to the heights. 6 units of rain water are being trapped.
```

**Example 2:**
```text
Input:
6
4 2 0 3 2 5

Output:
9

Explanation:
Between 4 and 5, water can form.
```

### Test Cases
```text
Test Case 1 (Valley):
Input:
3
2 0 2
Output:
2
(The middle slot (index 1) can hold 2 units of water)

Test Case 2 (Hill):
Input:
3
1 2 1
Output:
0
(Water spills off the sides)

Test Case 3 (Slope):
Input:
4
1 2 3 4
Output:
0

Test Case 4 (Flat):
Input:
3
0 0 0
Output:
0

Test Case 5 (Complex):
Input:
12
0 1 0 2 1 0 1 3 2 1 2 1
Output:
6
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) (Two Pointer) or O(N) (Array pre-calculation).
- **Approach:**
  1. **Two Pointers**: Use `left` and `right` pointers. Keep track of `leftMax` and `rightMax`. If `height[left] < height[right]`, then if `height[left] >= leftMax` update `leftMax` else add `leftMax - height[left]` to result. Move `left`. Similarly for right.

---

## Problem 12: Special Product Array
**Difficulty:** Medium  
**Topic:** Arrays  
**Asked In:** Microsoft, Facebook, Amazon  

### Problem Description
You are given an array `nums`. You need to return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.

**Important:** You must solve this **without division** and in **O(N)** time complexity.

**Constraints:**
- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- The product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.

### Input Format
- An integer `n`.
- An array `nums` of size `n`.

### Output Format
- The array `answer` elements separated by spaces.

### Examples

**Example 1:**
```text
Input:
4
1 2 3 4

Output:
24 12 8 6

Explanation:
[2*3*4, 1*3*4, 1*2*4, 1*2*3] = [24, 12, 8, 6]
```

**Example 2:**
```text
Input:
5
-1 1 0 -3 3

Output:
0 0 9 0 0

Explanation:
Zero handles correctly. Product except 0 is -1*1*-3*3 = 9.
```

### Test Cases
```text
Test Case 1 (Standard):
Input:
3
2 3 4
Output:
12 8 6

Test Case 2 (Two Zeros):
Input:
4
1 0 3 0
Output:
0 0 0 0

Test Case 3 (One Zero):
Input:
4
1 2 0 4
Output:
0 0 8 0

Test Case 4 (Negative):
Input:
3
-2 -3 -4
Output:
12 8 6

Test Case 5 (Large Input):
Input:
5
1 1 1 1 1
Output:
1 1 1 1 1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N) for output array (O(1) auxiliary allowed).
- **Approach:**
  1. Calculate `prefix` products in a pass.
  2. Calculate `suffix` products in a pass (or on the fly).
  3. `ans[i] = prefix[i-1] * suffix[i+1]`.

---

## Problem 13: The Maximum Product Segment
**Difficulty:** Medium  
**Topic:** Arrays  
**Asked In:** Amazon, D-E-Shaw, Microsoft  

### Problem Description
Given an integer array `nums`, find a contiguous non-empty subarray within the array that has the **largest product**, and return the product.

**Constraints:**
- `1 <= nums.length <= 2 * 10^4`
- `-10 <= nums[i] <= 10`
- The product of any subarray will fit in a 32-bit integer.

### Input Format
- An integer `n`.
- An array `nums`.

### Output Format
- A single integer representing maximum product.

### Examples

**Example 1:**
```text
Input:
4
2 3 -2 4

Output:
6

Explanation:
[2, 3] has product 6.
```

**Example 2:**
```text
Input:
3
-2 0 -1

Output:
0

Explanation:
The result cannot be 2, because [-2,-1] is not a subarray.
```

### Test Cases
```text
Test Case 1 (Negative Numbers flip):
Input:
4
-2 3 -4 2
Output:
48
([-2, 3, -4, 2] = 48)

Test Case 2 (All Negative):
Input:
3
-2 -3 -4
Output:
12
([-3, -4] = 12)

Test Case 3 (Zero Breaker):
Input:
5
2 3 0 4 5
Output:
20
([4, 5] = 20)

Test Case 4 (Single Negative):
Input:
1
-5
Output:
-5

Test Case 5 (Large N):
Input:
3
10 10 10
Output:
1000
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:**
  1. Keep track of `max_so_far` and `min_so_far` (because a negative * negative can become max).
  2. Swap `max` and `min` if current number is negative.
  3. Update global max.

---

## Problem 14: Rotated Array Minima
**Difficulty:** Medium  
**Topic:** Arrays, Binary Search  
**Asked In:** Adobe, Amazon, Microsoft  

### Problem Description
Suppose an array of length `n` sorted in ascending order is rotated between `1` and `n` times.
You need to find the **minimum element** in this array.
You must write an algorithm that runs in **O(log N)** time.

**Constraints:**
- `1 <= nums.length <= 5000`
- `-5000 <= nums[i] <= 5000`
- All integers are unique.

### Input Format
- An integer `n`.
- An array `nums`.

### Output Format
- A single integer.

### Examples

**Example 1:**
```text
Input:
5
3 4 5 1 2

Output:
1
```

**Example 2:**
```text
Input:
7
4 5 6 7 0 1 2

Output:
0
```

### Test Cases
```text
Test Case 1 (Not rotated):
Input:
3
1 2 3
Output:
1

Test Case 2 (Full rotation):
Input:
2
2 1
Output:
1

Test Case 3 (Single Element):
Input:
1
10
Output:
10

Test Case 4 (Left Heavy):
Input:
5
5 1 2 3 4
Output:
1

Test Case 5 (Right Heavy):
Input:
5
2 3 4 5 1
Output:
1
```

### Solution Expectation
- **Time Complexity:** O(log N)
- **Space Complexity:** O(1)
- **Approach:** Binary Search. If `nums[mid] > nums[high]`, the min is to the right (`low = mid + 1`). Else, it's to the left (or is mid) (`high = mid`).

---

## Problem 15: The Sum Pair in Rotated Array
**Difficulty:** Medium  
**Topic:** Arrays, Two Pointers  
**Asked In:** Microsoft, Google  

### Problem Description
Given a **sorted and rotated** array of distinct integers and a target sum `x`, find if there is a pair in the array with sum equal to `x`.

**Constraints:**
- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i], x <= 10^4`

### Input Format
- An integer `n` and target `x`.
- An array `nums`.

### Output Format
- "true" if found, else "false".

### Examples

**Example 1:**
```text
Input:
6 16
11 15 6 8 9 10

Output:
true

Explanation:
Pair (6, 10) sums to 16.
```

**Example 2:**
```text
Input:
4 100
10 20 30 40

Output:
false
```

### Test Cases
```text
Test Case 1 (Pivot involved):
Input:
5 5
4 5 1 2 3
Output:
true

Test Case 2 (Duplicate sum impossible):
Input:
3 4
1 2 3
Output:
false

Test Case 3 (Single):
Input:
1 5
5
Output:
false

Test Case 4 (Smallest):
Input:
2 3
2 1
Output:
true

Test Case 5 (No Rotation):
Input:
4 7
1 2 3 4
Output:
true
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:**
  1. Find the `pivot` (largest element).
  2. Use Two Pointers: `left` (pivot+1) and `right` (pivot).
  3. Move pointers cyclically (`left = (left + 1)%n`, `right = (right - 1 + n)%n`) based on sum comparison.

---

## Problem 16: The Trio Sum Zero
**Difficulty:** Medium  
**Topic:** Arrays, Two Pointers  
**Asked In:** Adobe, Amazon, Microsoft, Facebook  

### Problem Description
You are given an integer array `nums`. You need to return all unique triplets `[nums[i], nums[j], nums[k]]` such that their sum is exactly zero (`nums[i] + nums[j] + nums[k] == 0`) and the indices are distinct (`i != j`, `i != k`, `j != k`).

The solution set must not contain duplicate triplets.

**Constraints:**
- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

### Input Format
- An integer `n`.
- An array `nums`.

### Output Format
- A list of triplets printed one per line. (Triplets should be sorted internally, and the output lines should be sorted).

### Examples

**Example 1:**
```text
Input:
6
-1 0 1 2 -1 -4

Output:
-1 -1 2
-1 0 1

Explanation:
Triplets summing to 0 are:
[-1, 0, 1]
[-1, 2, -1] -> sorted to [-1, -1, 2]
```

**Example 2:**
```text
Input:
3
0 1 1

Output:
(No Output)

Explanation:
No triplet sums to 0.
```

### Test Cases
```text
Test Case 1 (All Zeros):
Input:
5
0 0 0 0 0
Output:
0 0 0

Test Case 2 (Positive/Negative Mix):
Input:
6
-2 0 1 1 2
(Wait: -2,0,1,1,2 sums? -2+0+2=0. -2+1+1=0.)
Input:
5
-2 0 1 1 2
Output:
-2 0 2
-2 1 1

Test Case 3 (No Solution):
Input:
3
1 2 3
Output:
(Empty)

Test Case 4 (Large Negative):
Input:
4
-100 50 50 10
Output:
-100 50 50

Test Case 5 (Duplicates handling):
Input:
6
-1 -1 -1 2 2 2
Output:
-1 -1 2
```

### Solution Expectation
- **Time Complexity:** O(N^2)
- **Space Complexity:** O(1) (excluding output storage).
- **Approach:**
  1. Sort the array.
  2. Iterate `i` from `0` to `n-3`.
  3. Skip duplicates for `i`.
  4. Use Two Pointers `left = i+1`, `right = n-1`.
  5. If `sum == 0`, add triplet, skip duplicates for `left` and `right`, move pointers.
  6. If `sum < 0`, `left++`. If `sum > 0`, `right--`.

---

## Problem 17: The Hydraulic Storage
**Difficulty:** Medium  
**Topic:** Arrays, Two Pointers  
**Asked In:** Flipkart, Dunzo, Amazon  

### Problem Description
You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with cylinder walls (x-axis) form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Constraints:**
- `2 <= height.length <= 10^5`
- `0 <= height[i] <= 10^4`

### Input Format
- An integer `n`.
- An array `height`.

### Output Format
- A single integer max area.

### Examples

**Example 1:**
```text
Input:
9
1 8 6 2 5 4 8 3 7

Output:
49

Explanation:
Lines at index 1 (height 8) and index 8 (height 7).
Width = 8 - 1 = 7.
Height = min(8, 7) = 7.
Area = 7 * 7 = 49.
```

**Example 2:**
```text
Input:
2
1 1

Output:
1
```

### Test Cases
```text
Test Case 1 (Steep Walls):
Input:
2
1000 1000
Output:
1000

Test Case 2 (Far apart small walls):
Input:
2
1 1
(Width 1, height 1 -> 1)
Wait, input length n is separate
Input:
5
1 100 100 1 1
Output:
100
(Indices 1 and 2, width 1, height 100)

Test Case 3 (Ascending):
Input:
5
1 2 3 4 5
Output:
6
(1 and 5 -> width 4, h 1 -> 4)
(4 and 5 -> width 1, h 4 -> 4)
(3 and 5 -> width 2, h 3 -> 6) <= Max

Test Case 4 (Descending):
Input:
4
4 3 2 1
Output:
4
(4 and 2 (val 3) -> width 1, h 3 -> 3)
(4 and 1 -> width 3, h 1 -> 3)
Wait: Max is 4? 4 and 2 -> width 1 Area 3.
4 and 3 -> width 1 Area 3.
Indices: 0(4), 1(3), 2(2), 3(1).
0-1: 1*3=3
0-2: 2*2=4 <--
0-3: 3*1=3
Max 4.

Test Case 5 (Large N):
Input:
3
10 500 10
Output:
20
(10 and 10 -> width 2 * 10 = 20)
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Two Pointers.
  1. `left = 0`, `right = n-1`.
  2. `Area = (right - left) * min(height[left], height[right])`.
  3. Update max area.
  4. Move the pointer pointing to the shorter line inward (to potentially find a taller line).

---

## Problem 18: The Complementary Couple
**Difficulty:** Easy  
**Topic:** Arrays, Hashing  
**Asked In:** Infosys, Amazon, Flipkart  

### Problem Description
Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

**Constraints:**
- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`

### Input Format
- An integer `n` and `target`.
- An array `nums`.

### Output Format
- Two integers separated by space (indices).

### Examples

**Example 1:**
```text
Input:
4 9
2 7 11 15

Output:
0 1

Explanation:
nums[0] + nums[1] = 2 + 7 = 9.
```

**Example 2:**
```text
Input:
3 6
3 2 4

Output:
1 2

Explanation:
2 + 4 = 6. Indices 1 and 2.
```

### Test Cases
```text
Test Case 1 (Negative):
Input:
4 0
-3 4 3 90
Output:
0 2

Test Case 2 (Identical numbers):
Input:
2 6
3 3
Output:
0 1

Test Case 3 (Not adjacent):
Input:
4 10
1 5 2 9
Output:
0 3
(1+9=10)

Test Case 4 (Large values):
Input:
2 2000000
1000000 1000000
Output:
0 1

Test Case 5 (First and Last):
Input:
5 10
5 1 2 3 5
Output:
0 4
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)
- **Approach:** Use a HashMap. Store `{value: index}`.
  Iterate `i`: `complement = target - nums[i]`. If `complement` in Map, return `[map[complement], i]`. Else add `nums[i]` to Map.

---

## Problem 19: The K-th Lowest Rank
**Difficulty:** Medium  
**Topic:** Arrays, Heap, Selection  
**Asked In:** ABCO, Accolite, Amazon  

### Problem Description
Given an array `arr` and a number `k` where `k` is smaller than the size of the array, find the `k`-th **smallest** element in the given array. It is given that all array elements are distinct.

**Constraints:**
- `1 <= k <= arr.length <= 10^5`
- `-10^5 <= arr[i] <= 10^5`

### Input Format
- An integer `n`.
- An array `arr`.
- An integer `k`.

### Output Format
- A single integer.

### Examples

**Example 1:**
```text
Input:
6
7 10 4 3 20 15
3

Output:
7

Explanation:
Sorted: 3, 4, 7, 10, 15, 20.
3rd smallest is 7.
```

**Example 2:**
```text
Input:
5
7 10 4 20 15
4

Output:
15

Explanation:
Sorted: 4, 7, 10, 15, 20.
4th smallest is 15.
```

### Test Cases
```text
Test Case 1 (k=1):
Input:
5
5 4 3 2 1
1
Output:
1

Test Case 2 (k=n):
Input:
5
5 4 3 2 1
5
Output:
5

Test Case 3 (Negative):
Input:
3
-1 -5 2
1
Output:
-5

Test Case 4 (Already Sorted):
Input:
4
1 2 3 4
2
Output:
2

Test Case 5 (Reverse Sorted):
Input:
4
4 3 2 1
2
Output:
2
```

### Solution Expectation
- **Time Complexity:** O(N log k) using Max-Heap, or O(N) QuickSelect.
- **Space Complexity:** O(k) or O(1).
- **Approach:**
  1. **Max-Heap**: Maintain heap size `k`. If element < heap.top, pop and push. Top is answer.
  2. **QuickSelect**: Same as Kth Largest but logic inverted for partition index.

---

## Problem 20: The Time Interval Merger
**Difficulty:** Medium  
**Topic:** Arrays, Sorting  
**Asked In:** Google, LinkedIn, Microsoft  

### Problem Description
You are given an array of `intervals` where `intervals[i] = [start_i, end_i]`. 

Merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

**Constraints:**
- `1 <= intervals.length <= 10^4`
- `0 <= start_i <= end_i <= 10^4`

### Input Format
- An integer `n`.
- `n` lines, each containing two integers `start` and `end`.

### Output Format
- The merged intervals, one per line.

### Examples

**Example 1:**
```text
Input:
4
1 3
2 6
8 10
15 18

Output:
1 6
8 10
15 18

Explanation:
Intervals [1,3] and [2,6] overlap since 2 < 3. Merger is [1,6].
```

**Example 2:**
```text
Input:
2
1 4
4 5

Output:
1 5

Explanation:
Touching intervals [1,4] and [4,5] are treated as overlapping.
```

### Test Cases
```text
Test Case 1 (Subsumed):
Input:
2
1 10
2 5
Output:
1 10

Test Case 2 (All disjoint):
Input:
3
1 2
3 4
5 6
Output:
1 2
3 4
5 6

Test Case 3 (All overlapping chain):
Input:
3
1 3
2 4
3 5
Output:
1 5

Test Case 4 (Single):
Input:
1
1 2
Output:
1 2

Test Case 5 (Unsorted Input):
Input:
3
8 10
1 3
2 6
Output:
1 6
8 10
```

### Solution Expectation
- **Time Complexity:** O(N log N)
- **Space Complexity:** O(N)
- **Approach:**
  1. Sort intervals by start time.
  2. Iterate through intervals.
  3. If `current.start <= last_merged.end`, merge them (`last_merged.end = max(last_merged.end, current.end)`).
  4. Else, add current to merged list.

---

## Problem 21: The Palindrome Transformation
**Difficulty:** Medium  
**Topic:** Arrays  
**Asked In:** Amazon, Google  

### Problem Description
You are given an array of positive integers. In one operation, you can choose any two adjacent elements and replace them with their sum. 

Your task is to find the **minimum number of operations** required to make the array a **palindrome**.
(An array is a palindrome if it reads the same forward and backward).

**Constraints:**
- `1 <= arr.length <= 1000`
- `1 <= arr[i] <= 10^6`

### Input Format
- An integer `n`.
- An array `arr`.

### Output Format
- A single integer representing the minimum operations.

### Examples

**Example 1:**
```text
Input:
4
1 4 5 1

Output:
1

Explanation:
Merge 4 and 5 -> [1, 9, 1]. This is a palindrome. 1 Operation.
```

**Example 2:**
```text
Input:
5
11 13 15 15 11

Output:
0

Explanation:
Already a palindrome.
```

### Test Cases
```text
Test Case 1 (Multiple Merges):
Input:
5
1 2 3 6
(Wait sum must match. 1+2+3=6. 6. -> 6 6)
Input:
4
1 2 3 6
Output:
2
(Merge 1+2 -> 3. Arr: 3 3 6. Merge 3+3->6. Arr: 6 6. Ops: 2)
Or Merge 1+2+3 -> 6. [6, 6]. 
Wait: 1,2,3 -> 3,3 -> match 6.

Test Case 2 (Single Element):
Input:
1
10
Output:
0

Test Case 3 (All mismatch needs merge to valid):
Input:
3
1 2 3
(Can become [6] - palindrome. Ops 2).
Output:
2

Test Case 4 (Complex):
Input:
5
1 4 5 9 1
Output:
1
(4+5=9 -> 1 9 9 1. Palindrome)

Test Case 5 (No solution possible?):
No, you can always merge all to one single element [Sum], which is a palindrome.
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Two Pointers `i=0, j=n-1`.
  - If `arr[i] == arr[j]`: `i++, j--`.
  - If `arr[i] < arr[j]`: Merge `arr[i]` with `arr[i+1]`, `ops++`.
  - If `arr[i] > arr[j]`: Merge `arr[j]` with `arr[j-1]`, `ops++`.

---

## Problem 22: The Largest Value Formation
**Difficulty:** Medium  
**Topic:** Arrays, Sorting  
**Asked In:** Barclays, Amazon, Microsoft  

### Problem Description
Given a list of non-negative integers, arrange them such that they form the **largest possible number**.
Since the result may be very large, return it as a string.

**Constraints:**
- `1 <= nums.length <= 100`
- `0 <= nums[i] <= 10^9`

### Input Format
- An integer `n`.
- An array `nums`.

### Output Format
- A single string representing the largest number.

### Examples

**Example 1:**
```text
Input:
2
10 2

Output:
210

Explanation:
"210" > "102".
```

**Example 2:**
```text
Input:
5
3 30 34 5 9

Output:
9534330
```

### Test Cases
```text
Test Case 1 (Zeros):
Input:
2
0 0
Output:
0
(Special case: "00" should be "0")

Test Case 2 (Prefixes):
Input:
3
1 10 100
Output:
110100

Test Case 3 (Same first digits):
Input:
3
34 3 34
Output:
34343
(34 > 3. 34343)

Test Case 4 (Single):
Input:
1
5
Output:
5

Test Case 5 (Large):
Input:
4
999 99 9 98
Output:
99999998
```

### Solution Expectation
- **Time Complexity:** O(N log N)
- **Space Complexity:** O(1) (excluding output).
- **Approach:** Custom Sort. Compare two strings `a` and `b`. If `a+b > b+a`, then `a` comes before `b`. Handle leading zeros.

---

## Problem 23: The Compact Absentee Tracker
**Difficulty:** Medium  
**Topic:** Bit Manipulation, Arrays  
**Asked In:** Amazon, Oracle, Adobe  

### Problem Description
You are given an array `nums` where every element appears **three times** except for one, which appears exactly once. Find the single element.

You must implement a solution with a linear runtime complexity and use **only constant extra space** (Space Optimization).

**Constraints:**
- `1 <= nums.length <= 3 * 10^4`
- `-2^31 <= nums[i] <= 2^31 - 1`

### Input Format
- An integer `n`.
- An array `nums`.

### Output Format
- A single integer.

### Examples

**Example 1:**
```text
Input:
4
2 2 3 2

Output:
3
```

**Example 2:**
```text
Input:
7
0 1 0 1 0 1 99

Output:
99
```

### Test Cases
```text
Test Case 1 (Negative):
Input:
4
-2 -2 3 -2
Output:
3

Test Case 2 (Single Element):
Input:
1
10
Output:
10

Test Case 3 (Max Int):
Input:
4
2147483647 5 5 5
Output:
2147483647

Test Case 4 (Large Loop):
Input:
7
3 3 3 4 4 4 5
Output:
5

Test Case 5 (Zeros):
Input:
4
0 0 0 -1
Output:
-1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Bitwise counting.
  1. Count set bits at each position (0-31) for all numbers.
  2. If count % 3 != 0, that bit belongs to the answer.
  3. Construct answer from bits.

---

## Problem 24: The Divisible Data Segments
**Difficulty:** Medium  
**Topic:** Arrays, Hashing  
**Asked In:** Microsoft, Snapdeal  

### Problem Description
Given an integer array `nums` and an integer `k`, return the number of **non-empty subarrays** that have a sum divisible by `k`.

A subarray is a contiguous part of an array.

**Constraints:**
- `1 <= nums.length <= 3 * 10^4`
- `-10^4 <= nums[i] <= 10^4`
- `2 <= k <= 10^4`

### Input Format
- An integer `n`.
- An array `nums`.
- An integer `k`.

### Output Format
- A single integer (count).

### Examples

**Example 1:**
```text
Input:
6
4 5 0 -2 -3 1
5

Output:
7

Explanation:
Subarrays: [5], [0], [5,0], [-2,-3], [5,0,-2,-3], [0,-2,-3], [-2,-3,1,4]? No index not cyclic.
Valid: [4, 5, 0, -2, -3, 1] sum=5.
[5], [0], [5,0], [-2,-3] (sum -5), [0,-2,-3] (-5), [5,0,-2,-3] (0), [4,5,0,-2,-3,1] (5).
Count = 7.
```

### Test Cases
```text
Test Case 1 (Positive):
Input:
3
1 2 3
3
Output:
3
([3], [1,2], [1,2,3] -> sum 6)

Test Case 2 (Negative):
Input:
2
-1 1
2
Output:
1
([-1, 1] sum 0)

Test Case 3 (Zeros):
Input:
3
0 0 0
3
Output:
6
([0],[0],[0], [0,0],[0,0], [0,0,0])

Test Case 4 (Single Element divisble):
Input:
1
5
5
Output:
1

Test Case 5 (No solution):
Input:
1
1
2
Output:
0
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(k) (Hashmap of remainders).
- **Approach:** Prefix Sum + HashMap.
  1. Maintain `running_sum`.
  2. Calculate `remainder = running_sum % k`. 
  3. Handle negative remainders (`if rem < 0: rem += k`).
  4. If `remainder` seen before, add frequency to count.
  5. Store/Update frequency of `remainder`.

---

## Problem 25: The Delegation Combinations
**Difficulty:** Medium  
**Topic:** Backtracking, Recursion  
**Asked In:** Amazon, Adobe  

### Problem Description
Given an array of `n` distinct integers and a number `r`, print all possible **combinations** of `r` elements chosen from the array.

The order of elements within a combination does not matter (i.e., `[1, 2]` is same as `[2, 1]`), but you should print them in the order they appear in finding them (lexicographically or index-wise).

**Constraints:**
- `1 <= r <= n <= 20`
- `-100 <= arr[i] <= 100`

### Input Format
- An integer `n`.
- An integer `r`.
- An array `arr`.

### Output Format
- Print each combination on a new line, elements separated by space.

### Examples

**Example 1:**
```text
Input:
4 2
1 2 3 4

Output:
1 2
1 3
1 4
2 3
2 4
3 4
```

**Example 2:**
```text
Input:
3 3
1 2 3

Output:
1 2 3
```

### Test Cases
```text
Test Case 1 (r=1):
Input:
3 1
1 2 3
Output:
1
2
3

Test Case 2 (Sorted Input):
Input:
4 2
1 2 3 4
Output:
(As example 1)

Test Case 3 (r=n):
Input:
3 3
5 6 7
Output:
5 6 7

Test Case 4 (Unsorted):
Input:
3 2
3 1 2
Output:
3 1
3 2
1 2
(Depending on logic, usually combinations treat input as a set. "3 1" and "1 3" same. 
Usually we pick indices index i, then i+1. So 3 1, 3 2, 1 2).

Test Case 5 (Negative):
Input:
3 2
-1 -2 -3
Output:
-1 -2
-1 -3
-2 -3
```

### Solution Expectation
- **Time Complexity:** O(nCr)
- **Space Complexity:** O(r) (Recursion stack).
- **Approach:** Recursion / Backtracking.
  `combine(start_index, current_list)`
  - If `current_list.size == r`, print and return.
  - For `i` from `start_index` to `n`:
    - Add `arr[i]` to `current_list`.
    - `combine(i + 1, current_list)`.
    - Backtrack (remove `arr[i]`).

---

## Problem 26: The Range Query Optimization
**Difficulty:** Hard  
**Topic:** Arrays, Square Root Decomposition  
**Asked In:** Microsoft, Directi  

### Problem Description
You are given an array `arr` of `n` elements and `q` queries. Each query consists of a range `[L, R]`. You need to compute the sum of elements in this range.
While this sounds simple, `n` and `q` are very large (up to `10^5`), and the queries are given offline (you know all queries beforehand).

Optimize the processing of these queries using **Mo's Algorithm** (Square Root Decomposition) to answer them faster than standard iteration.

**Constraints:**
- `1 <= n, q <= 10^5`
- `1 <= arr[i] <= 10^9`

### Input Format
- An integer `n`.
- An array `arr`.
- An integer `q`.
- `q` lines containing `L` and `R` (0-indexed).

### Output Format
- `q` lines, each containing the sum for that query.

### Examples

**Example 1:**
```text
Input:
5
1 1 2 1 3
3
0 4
1 3
2 4

Output:
8
4
6

Explanation:
0-4: 1+1+2+1+3 = 8
1-3: 1+2+1 = 4
2-4: 2+1+3 = 6
```

### Test Cases
```text
Test Case 1 (Single Query):
Input:
3
1 2 3
1
0 2
Output:
6

Test Case 2 (Disjoint):
Input:
4
1 2 3 4
2
0 1
2 3
Output:
3
7

Test Case 3 (Overlapping):
Input:
3
10 20 30
2
0 1
1 2
Output:
30
50

Test Case 4 (Full Range):
Input:
1
100
1
0 0
Output:
100

Test Case 5 (Large Values):
Input:
2
1000 2000
1
0 1
Output:
3000
```

### Solution Expectation
- **Time Complexity:** O((N+Q) * sqrt(N))
- **Space Complexity:** O(N)
- **Approach:** 
  1. Divide array into blocks of size `sqrt(N)`. 
  2. Sort queries based on block of `L`. If block is same, sort by `R`.
  3. Maintain `current_L`, `current_R`, `current_sum`.
  4. Move `current_L` and `current_R` to match query, updating sum incrementally.

---

# Interview DSA Course - Module 2: Strings

---

## Problem 27: The Palindrome Verification
**Difficulty:** Easy  
**Topic:** Strings, Two Pointers  
**Asked In:** Amazon, Adobe, Microsoft  

### Problem Description
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

**Constraints:**
- `1 <= s.length <= 2 * 10^5`
- `s` consists only of printable ASCII characters.

### Input Format
- A single line containing string `s`.

### Output Format
- `true` or `false`.

### Examples

**Example 1:**
```text
Input:
"A man, a plan, a canal: Panama"

Output:
true

Explanation:
"amanaplanacanalpanama" is a palindrome.
```

**Example 2:**
```text
Input:
"race a car"

Output:
false

Explanation:
"raceacar" is not a palindrome.
```

### Test Cases
```text
Test Case 1 (Empty/Space):
Input:
" "
Output:
true
(Empty string after removal is palindrome)

Test Case 2 (Case Sensitive):
Input:
"AbBa"
Output:
true

Test Case 3 (Numbers):
Input:
"123321"
Output:
true

Test Case 4 (Symbols):
Input:
".,,"
Output:
true

Test Case 5 (Normal Fail):
Input:
"hello"
Output:
false
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** Two Pointers.
  - `start`, `end`.
  - Skip non-alphanumeric chars.
  - Compare lowercase(char).
  - Return false if mismatch.

---

## Problem 28: The Anagram Audit
**Difficulty:** Easy  
**Topic:** Strings, Hashing  
**Asked In:** Nagarro, Google, Adobe  

### Problem Description
Given two strings `s` and `t`, return `true` if `t` is an **anagram** of `s`, and `false` otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Constraints:**
- `1 <= s.length, t.length <= 5 * 10^4`
- `s` and `t` consist of lowercase English letters.

### Input Format
- Two strings `s` and `t` on separate lines.

### Output Format
- `true` or `false`.

### Examples

**Example 1:**
```text
Input:
anagram
nagaram

Output:
true
```

**Example 2:**
```text
Input:
rat
car

Output:
false
```

### Test Cases
```text
Test Case 1 (Different Lengths):
Input:
abc
ab
Output:
false

Test Case 2 (Same Letters different counts):
Input:
aab
abb
Output:
false

Test Case 3 (Same String):
Input:
test
test
Output:
true

Test Case 4 (Empty):
Input:
""
""
Output:
true

Test Case 5 (Large):
Input:
(long string a...z)
(shuffled string a...z)
Output:
true
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) (26 chars) or O(N).
- **Approach:** Frequency Array of size 26.
  - Increment for `s`, decrement for `t`.
  - Check if all counts are zero.

---

## Problem 29: The Balanced Syntax
**Difficulty:** Easy  
**Topic:** Strings, Stack  
**Asked In:** Google, Facebook, Amazon  

### Problem Description
Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Constraints:**
- `1 <= s.length <= 10^4`

### Input Format
- A string `s`.

### Output Format
- `true` or `false`.

### Examples

**Example 1:**
```text
Input:
()[]{}

Output:
true
```

**Example 2:**
```text
Input:
(]

Output:
false
```

### Test Cases
```text
Test Case 1 (Nested):
Input:
{[]}
Output:
true

Test Case 2 (Unclosed):
Input:
{{
Output:
false

Test Case 3 (Wrong Order):
Input:
([)]
Output:
false

Test Case 4 (Single Close):
Input:
]
Output:
false

Test Case 5 (Complex):
Input:
(([]){})
Output:
true
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)
- **Approach:** Stack. Push open brackets. When closing bracket comes, pop stack and check matching. If stack empty or mismatch, false. Finally stack must be empty.

---

## Problem 30: The Consecutive Cleaner
**Difficulty:** Easy  
**Topic:** Strings  
**Asked In:** Samsung, Adobe  

### Problem Description
Given a string `s`, remove all **consecutive duplicates** recursively/iteratively such that no two adjacent characters are the same in the final string.

(E.g. `aabbc` -> `abc`).

**Constraints:**
- `1 <= s.length <= 10^5`

### Input Format
- A string `s`.

### Output Format
- The modified string.

### Examples

**Example 1:**
```text
Input:
aabbcc

Output:
abc
```

**Example 2:**
```text
Input:
aabaa

Output:
aba

Explanation:
a, a -> a. b -> b. a, a -> a. Result aba.
```

### Test Cases
```text
Test Case 1 (No Duplicates):
Input:
abc
Output:
abc

Test Case 2 (All Same):
Input:
aaaaa
Output:
a

Test Case 3 (Alternating):
Input:
abab
Output:
abab

Test Case 4 (Empty):
Input:
(empty)
Output:
(empty)

Test Case 5 (End Duplicate):
Input:
abcc
Output:
abc
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N) (Output string).
- **Approach:** Iterate string. If `s[i] != s[i-1]`, append to result.

---

## Problem 31: The Shared Prefix Search
**Difficulty:** Easy  
**Topic:** Strings  
**Asked In:** Adobe, Google  

### Problem Description
Write a function to find the **longest common prefix** string amongst an array of strings.
If there is no common prefix, return an empty string.

**Constraints:**
- `1 <= strs.length <= 200`
- `0 <= strs[i].length <= 200`

### Input Format
- An integer `n`.
- `n` strings.

### Output Format
- A single string.

### Examples

**Example 1:**
```text
Input:
3
flower flow flight

Output:
fl

Explanation:
"fl" is common to all.
```

**Example 2:**
```text
Input:
3
dog racecar car

Output:
(Empty)
```

### Test Cases
```text
Test Case 1 (Identical):
Input:
2
test test
Output:
test

Test Case 2 (Prefix Match Whole):
Input:
2
ab abc
Output:
ab

Test Case 3 (Single Char):
Input:
3
a b c
Output:
(Empty)

Test Case 4 (One String):
Input:
1
hello
Output:
hello

Test Case 5 (Empty String in List):
Input:
2
a ""
Output:
(Empty)
```

### Solution Expectation
- **Time Complexity:** O(S) where S is sum of all characters.
- **Space Complexity:** O(1).
- **Approach:** Take first string as `prefix`. Iterate others. While `next_string.indexOf(prefix) != 0`, shorten `prefix`.

---

## Problem 32: The Keypad Translator
**Difficulty:** Medium  
**Topic:** Strings, Mapping  
**Asked In:** Adobe, Amazon  

### Problem Description
Convert a given sentence into its equivalent **mobile numeric keypad sequence**.

Keypad Mapping:
- 2: ABC
- 3: DEF
- 4: GHI
- 5: JKL
- 6: MNO
- 7: PQRS
- 8: TUV
- 9: WXYZ
- 0: Space

**Constraints:**
- String consists of uppercase English letters and spaces.

### Input Format
- A string `s`.

### Output Format
- A numeric string.

### Examples

**Example 1:**
```text
Input:
GEEKSFORGEEKS

Output:
4333355777733366677743333557777
```

**Example 2:**
```text
Input:
HELLO WORLD

Output:
4433555555666096667775553
```

### Test Cases
```text
Test Case 1 (A):
Input:
A
Output:
2

Test Case 2 (Z):
Input:
Z
Output:
9999

Test Case 3 (Spaces):
Input:
A B
Output:
2022

Test Case 4 (Repeated):
Input:
AA
Output:
22

Test Case 5 (Empty):
Input:
(empty)
Output:
(empty)
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(N)
- **Approach:** Precompute string array for each character. Iterate and append.

---

## Problem 33: The Frequency Report
**Difficulty:** Easy  
**Topic:** Strings, Hashing  
**Asked In:** Ola, Amdocs  

### Problem Description
Print all the duplicates in the input string along with their count.
Output should be sorted by character.

**Constraints:**
- `1 <= s.length <= 1000`

### Input Format
- A string `s`.

### Output Format
- Lines of `char count` for duplicates.

### Examples

**Example 1:**
```text
Input:
test string

Output:
s 2
t 3
```

**Example 2:**
```text
Input:
programming

Output:
g 2
m 2
r 2
```

### Test Cases
```text
Test Case 1 (No Duplicates):
Input:
abc
Output:
(No Output)

Test Case 2 (All Same):
Input:
aaaa
Output:
a 4

Test Case 3 (Case Sensitive):
Input:
Aa
Output:
(No Output if Case Sensitive)

Test Case 4 (Symbols):
Input:
..
Output:
. 2

Test Case 5 (Space):
Input:
a a
Output:
a 2 (If space ignored or space printed)
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1)
- **Approach:** HashMap or Frequency Array (256 size).

---

## Problem 34: The Unique Substream
**Difficulty:** Medium  
**Topic:** Strings, Sliding Window  
**Asked In:** Morgan Stanley, Amazon  

### Problem Description
Given a string `s`, find the length of the **longest substring** without repeating characters.

**Constraints:**
- `0 <= s.length <= 5 * 10^4`

### Input Format
- A string `s`.

### Output Format
- An integer length.

### Examples

**Example 1:**
```text
Input:
abcabcbb

Output:
3

Explanation:
The answer is "abc", with the length of 3.
```

**Example 2:**
```text
Input:
bbbbb

Output:
1

Explanation:
The answer is "b", with the length of 1.
```

### Test Cases
```text
Test Case 1 (Empty):
Input:
""
Output:
0

Test Case 2 (All Unique):
Input:
abcdef
Output:
6

Test Case 3 (Overlap):
Input:
pwwkew
Output:
3
("wke")

Test Case 4 (End):
Input:
dvdf
Output:
3
("vdf")

Test Case 5 (Space):
Input:
 
Output:
1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) (Charset size).
- **Approach:** Sliding Window with HashMap/Set. `left` pointer moves when duplicate found.

---

## Problem 35: The Character Replacement Strategy
**Difficulty:** Medium  
**Topic:** Strings, Sliding Window  
**Asked In:** Amazon, Google  

### Problem Description
You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most `k` times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.

**Constraints:**
- `1 <= s.length <= 10^5`
- `0 <= k <= s.length`

### Input Format
- A string `s`.
- An integer `k`.

### Output Format
- An integer length.

### Examples

**Example 1:**
```text
Input:
ABAB
2

Output:
4

Explanation:
Replace the two 'A's with 'B's or vice-versa.
```

**Example 2:**
```text
Input:
AABABBA
1

Output:
4

Explanation:
Replace the one 'A' in the middle with 'B' and form "AABBBBA".
The substring "BBBB" has length 4.
```

### Test Cases
```text
Test Case 1 (k=0):
Input:
AABAB
0
Output:
2
("AA" or "B")

Test Case 2 (All same):
Input:
AAAA
2
Output:
4

Test Case 3 (k >= length):
Input:
ABC
3
Output:
3

Test Case 4 (Complex):
Input:
ABBBAC
2
Output:
5
(Replace A and C -> BBBBB)

Test Case 5 (Single):
Input:
A
0
Output:
1
```

### Solution Expectation
- **Time Complexity:** O(N)
- **Space Complexity:** O(1) (26 counts).
- **Approach:** Sliding Window.
  `max_freq` in window.
  Condition: `(window_len - max_freq) <= k`.
  If valid, `max_len = max(max_len, window_len)`.
  Else, `left++`.

---


 
 - - -  
  
 # #   P r o b l e m   3 6 :   T h e   A n a g r a m   G r o u p i n g  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t r i n g s ,   H a s h i n g      
 * * A s k e d   I n : * *   A m a z o n ,   M i c r o s o f t ,   G o l d m a n   S a c h s      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   a n   a r r a y   o f   s t r i n g s ,   g r o u p   t h e   * * a n a g r a m s * *   t o g e t h e r .   Y o u   c a n   r e t u r n   t h e   a n s w e r   i n   a n y   o r d e r .  
  
 * * C o n s t r a i n t s : * *  
 -   ` 1   < =   s t r s . l e n g t h   < =   1 0 ^ 4 `  
 -   ` 0   < =   s t r s [ i ] . l e n g t h   < =   1 0 0 `  
  
 # # #   I n p u t   F o r m a t  
 -   A n   i n t e g e r   ` n ` .  
 -   ` n `   s t r i n g s .  
  
 # # #   O u t p u t   F o r m a t  
 -   G r o u p s   o f   s t r i n g s .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 6  
 e a t   t e a   t a n   a t e   n a t   b a t  
  
 O u t p u t :  
 b a t  
 n a t   t a n  
 a t e   e a t   t e a  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M a p   ` { s o r t e d _ s t r i n g   - >   l i s t } ` .  
  
 - - -  
  
 # #   P r o b l e m   3 7 :   T h e   L o n g e s t   P a l i n d r o m i c   S u b s t r i n g  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t r i n g s ,   D P      
 * * A s k e d   I n : * *   A m a z o n ,   M i c r o s o f t ,   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   a   s t r i n g   ` s ` ,   r e t u r n   t h e   * * l o n g e s t   p a l i n d r o m i c   s u b s t r i n g * *   i n   ` s ` .  
  
 * * C o n s t r a i n t s : * *  
 -   ` 1   < =   s . l e n g t h   < =   1 0 0 0 `  
  
 # # #   I n p u t   F o r m a t  
 -   A   s t r i n g   ` s ` .  
  
 # # #   O u t p u t   F o r m a t  
 -   T h e   s u b s t r i n g .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 b a b a d  
  
 O u t p u t :  
 b a b  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   E x p a n d   a r o u n d   c e n t e r   O ( N ^ 2 ) .  
  
 - - -  
  
 # #   P r o b l e m   3 8 :   T h e   P a l i n d r o m i c   C o u n t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t r i n g s ,   D P      
 * * A s k e d   I n : * *   F a c e b o o k ,   L i n k e d I n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   a   s t r i n g   ` s ` ,   d e t e r m i n e   t h e   * * n u m b e r   o f   p a l i n d r o m i c   s u b s t r i n g s * *   i n   i t .  
  
 # # #   I n p u t   F o r m a t  
 -   A   s t r i n g   ` s ` .  
  
 # # #   O u t p u t   F o r m a t  
 -   I n t e g e r   c o u n t .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 a b c  
  
 O u t p u t :  
 3  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   E x p a n d   a r o u n d   c e n t e r .  
  
 - - -  
  
 # #   P r o b l e m   3 9 :   T h e   P e r m u t a t i o n   I n c l u s i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t r i n g s ,   S l i d i n g   W i n d o w      
 * * A s k e d   I n : * *   M i c r o s o f t ,   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   t w o   s t r i n g s   ` s 1 `   a n d   ` s 2 ` ,   r e t u r n   ` t r u e `   i f   ` s 2 `   c o n t a i n s   a   * * p e r m u t a t i o n * *   o f   ` s 1 ` .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 a b  
 e i d b a o o o  
  
 O u t p u t :  
 t r u e  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   S l i d i n g   W i n d o w   o f   s i z e   ` l e n ( s 1 ) `   w i t h   f r e q u e n c y   m a p .  
  
 - - -  
  
 # #   P r o b l e m   4 0 :   T h e   D i s t i n c t   P a l i n d r o m i c   S e q u e n c e s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t r i n g s ,   D P      
 * * A s k e d   I n : * *   G o o g l e ,   L i n k e d I n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   a   s t r i n g   ` s ` ,   f i n d   t h e   n u m b e r   o f   * * d i f f e r e n t   n o n - e m p t y   p a l i n d r o m i c   s u b s e q u e n c e s * *   i n   ` s ` ,   m o d u l o   ` 1 0 ^ 9   +   7 ` .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 b c c b  
  
 O u t p u t :  
 6  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P   ` d p [ i ] [ j ] ` .  
  
 - - -  
  
 # #   P r o b l e m   4 1 :   T h e   S m a l l e s t   W i n d o w   C o v e r  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t r i n g s ,   S l i d i n g   W i n d o w      
 * * A s k e d   I n : * *   G o o g l e ,   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   t w o   s t r i n g s   ` s `   a n d   ` t ` ,   r e t u r n   t h e   * * m i n i m u m   w i n d o w   s u b s t r i n g * *   o f   ` s `   s u c h   t h a t   e v e r y   c h a r a c t e r   i n   ` t `   ( i n c l u d i n g   d u p l i c a t e s )   i s   i n c l u d e d   i n   t h e   w i n d o w .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 A D O B E C O D E B A N C  
 A B C  
  
 O u t p u t :  
 B A N C  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   S l i d i n g   W i n d o w .  
  
 - - -  
  
 # #   P r o b l e m   4 2 :   T h e   W i l d c a r d   P a t t e r n  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t r i n g s ,   D P      
 * * A s k e d   I n : * *   G o o g l e ,   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G i v e n   a n   i n p u t   s t r i n g   ` s `   a n d   a   p a t t e r n   ` p ` ,   i m p l e m e n t   w i l d c a r d   p a t t e r n   m a t c h i n g   w i t h   s u p p o r t   f o r   ` ' ? ' `   a n d   ` ' * ' ` .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 a a  
 *  
  
 O u t p u t :  
 t r u e  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   4 3 :   T h e   P a t t e r n   S e a r c h   ( K M P )  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t r i n g s ,   K M P      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I m p l e m e n t   K M P   a l g o r i t h m   t o   f i n d   f i r s t   o c c u r r e n c e   o f   ` p a t `   i n   ` t x t ` .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   K M P .  
  
 - - -  
  
 # #   P r o b l e m   4 4 :   T h e   R o l l i n g   H a s h   ( R a b i n - K a r p )  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t r i n g s      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I m p l e m e n t   R a b i n - K a r p   t o   f i n d   a l l   o c c u r r e n c e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R o l l i n g   H a s h .  
  
 - - -  
  
 # #   P r o b l e m   4 5 :   T h e   M i n i m a l   O p e r a t i o n s   T r a n s f o r m a t i o n  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t r i n g s      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   o p e r a t i o n s   t o   c o n v e r t   A   t o   B   b y   m o v i n g   c h a r   t o   f r o n t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k w a r d s   m a t c h i n g .  
  
 - - -  
  
 #   I n t e r v i e w   D S A   C o u r s e   -   M o d u l e   3 :   S e a r c h i n g   &   S o r t i n g  
  
 - - -  
  
 # #   P r o b l e m   4 6 :   T h e   O c c u r r e n c e   F i n d e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S e a r c h i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   f i r s t   a n d   l a s t   p o s i t i o n   o f   e l e m e n t   i n   s o r t e d   a r r a y .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 6  
 5   7   7   8   8   1 0  
 8  
  
 O u t p u t :  
 3   4  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h   t w i c e .  
  
 - - -  
  
 # #   P r o b l e m   4 7 :   T h e   R o t a t e d   S e a r c h   I I  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S e a r c h i n g      
 * * A s k e d   I n : * *   A d o b e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S e a r c h   i n   r o t a t e d   s o r t e d   a r r a y   w i t h   d u p l i c a t e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h   w i t h   d u p l i c a t e   h a n d l i n g .  
  
 - - -  
  
 # #   P r o b l e m   4 8 :   T h e   P r e c i s e   R o o t  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   S e a r c h i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o m p u t e   s q u a r e   r o o t   o f   x .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h .  
  
 - - -  
  
 # #   P r o b l e m   4 9 :   T h e   M a j o r i t y   C o n s e n s u s  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   A r r a y s ,   S o r t i n g      
 * * A s k e d   I n : * *   A m a z o n ,   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   m a j o r i t y   e l e m e n t   ( >   n / 2 ) .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M o o r e ' s   V o t i n g .  
  
 - - -  
  
 # #   P r o b l e m   5 0 :   T h e   P e a k   I d e n t i f i c a t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S e a r c h i n g      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   p e a k   e l e m e n t   i n d e x .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h .  
  
 - - -  
  
 # #   P r o b l e m   5 1 :   T h e   I n v e r s i o n   C o u n t  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S o r t i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u n t   i n v e r s i o n s   i n   a r r a y .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M e r g e   S o r t .  
  
 - - -  
  
 # #   P r o b l e m   5 2 :   T h e   Q u i c k   P a r t i t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S o r t i n g      
 * * A s k e d   I n : * *   S t a n d a r d      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I m p l e m e n t   Q u i c k   S o r t   P a r t i t i o n .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   P i v o t   l o g i c .  
  
 - - -  
  
 # #   P r o b l e m   5 3 :   T h e   B o o k   A l l o c a t o r  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   B i n a r y   S e a r c h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n i m i z e   m a x   p a g e s   a l l o c a t e d   t o   s t u d e n t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h   o n   A n s w e r .  
  
 - - -  
  
 # #   P r o b l e m   5 4 :   T h e   A g g r e s s i v e   H e r d e r s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   B i n a r y   S e a r c h      
 * * A s k e d   I n : * *   S P O J      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L a r g e s t   m i n i m u m   d i s t a n c e   b e t w e e n   c o w s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h   o n   A n s w e r .  
  
 - - -  
  
 # #   P r o b l e m   5 5 :   T h e   M e d i a n   o f   S o r t e d   A r r a y s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   B i n a r y   S e a r c h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   m e d i a n   o f   t w o   s o r t e d   a r r a y s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   P a r t i t i o n i n g .  
  
 - - -  
  
 - - -  
  
 # #   P r o b l e m   5 6 :   T h e   S p i r a l   T r a v e r s a l  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t r i x      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e t u r n   a l l   e l e m e n t s   o f   m a t r i x   i n   s p i r a l   o r d e r .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 3   3  
 1   2   3  
 4   5   6  
 7   8   9  
  
 O u t p u t :  
 1   2   3   6   9   8   7   4   5  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   S i m u l a t i o n .  
  
 - - -  
  
 # #   P r o b l e m   5 7 :   T h e   M a t r i x   Z e r o   S e t t e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t r i x      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S e t   r o w   a n d   c o l   t o   0   i f   e l e m e n t   i s   0 .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   U s e   f i r s t   r o w / c o l   a s   m a r k e r s .  
  
 - - -  
  
 # #   P r o b l e m   5 8 :   T h e   I m a g e   R o t a t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t r i x      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R o t a t e   i m a g e   b y   9 0   d e g r e e s   c l o c k w i s e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T r a n s p o s e   t h e n   r e v e r s e   r o w s .  
  
 - - -  
  
 # #   P r o b l e m   5 9 :   T h e   2 D   S e a r c h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t r i x      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S e a r c h   t a r g e t   i n   s o r t e d   m a t r i x .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   S e a r c h .  
  
 - - -  
  
 # #   P r o b l e m   6 0 :   T h e   R o w   w i t h   M a x i m u m   O n e s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t r i x      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   r o w   w i t h   m a x   1 s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T o p - r i g h t   s t a r t .  
  
 - - -  
  
 # #   P r o b l e m   6 1 :   T h e   L i n k e d   L i s t   R e v e r s a l  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A d o b e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e v e r s e   a   s i n g l y   l i n k e d   l i s t .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 1   2   3  
  
 O u t p u t :  
 3   2   1  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e .  
  
 - - -  
  
 # #   P r o b l e m   6 2 :   T h e   M i d d l e   N o d e  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   F l i p k a r t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   m i d d l e   o f   l i n k e d   l i s t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T o r t o i s e   a n d   H a r e .  
  
 - - -  
  
 # #   P r o b l e m   6 3 :   T h e   S o r t e d   M e r g e r  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M e r g e   t w o   s o r t e d   l i s t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e .  
  
 - - -  
  
 # #   P r o b l e m   6 4 :   T h e   N - t h   R e m o v a l  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e m o v e   n t h   n o d e   f r o m   e n d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T w o   p o i n t e r s .  
  
 - - -  
  
 # #   P r o b l e m   6 5 :   T h e   C y c l e   D e t e c t o r  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 D e t e c t   c y c l e   i n   l i s t .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 3   2   0   - 4  
 p o s = 1  
  
 O u t p u t :  
 t r u e  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   F l o y d ' s   C y c l e .  
  
 - - -  
  
 # #   P r o b l e m   6 6 :   T h e   S h a r e d   N o d e   I n t e r s e c t i o n  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   i n t e r s e c t i o n   n o d e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T w o   p o i n t e r s   s w i t c h i n g   h e a d s .  
  
 - - -  
  
 # #   P r o b l e m   6 7 :   T h e   P a l i n d r o m i c   L i s t  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e c k   i f   l i s t   i s   p a l i n d r o m e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e v e r s e   h a l f .  
  
 - - -  
  
 # #   P r o b l e m   6 8 :   T h e   C y c l e   S t a r t   P o i n t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e t u r n   n o d e   w h e r e   c y c l e   b e g i n s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   F l o y d ' s .  
  
 - - -  
  
 # #   P r o b l e m   6 9 :   T h e   K - G r o u p   R e v e r s a l  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e v e r s e   n o d e s   i n   k - g r o u p .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e   g r o u p   r e v e r s a l .  
  
 - - -  
  
 # #   P r o b l e m   7 0 :   T h e   C l o n e d   L i s t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   L i n k e d   L i s t      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C l o n e   l i s t   w i t h   r a n d o m   p o i n t e r s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I n t e r w e a v e   o r   M a p .  
  
 - - -  
  
 # #   P r o b l e m   7 1 :   T h e   M i n i m u m   E l e m e n t   S t a c k  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t a c k      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S t a c k   w i t h   g e t M i n ( ) .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T w o   s t a c k s .  
  
 - - -  
  
 # #   P r o b l e m   7 2 :   Q u e u e   v i a   S t a c k s  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   S t a c k      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I m p l e m e n t   Q u e u e   u s i n g   S t a c k s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T w o   s t a c k s .  
  
 - - -  
  
 # #   P r o b l e m   7 3 :   T h e   N e x t   G r e a t e r   E l e m e n t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   S t a c k      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   n e x t   g r e a t e r   e l e m e n t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M o n o t o n i c   S t a c k .  
  
 - - -  
  
 # #   P r o b l e m   7 4 :   T h e   H i s t o g r a m   A r e a  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   S t a c k      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L a r g e s t   r e c t a n g l e   i n   h i s t o g r a m .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M o n o t o n i c   S t a c k .  
  
 - - -  
  
 # #   P r o b l e m   7 5 :   T h e   S l i d i n g   W i n d o w   M a x i m u m  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   Q u e u e      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   i n   s l i d i n g   w i n d o w .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M o n o t o n i c   D e q u e .  
  
 - - -  
  
 # #   P r o b l e m   7 6 :   T h e   W e l l - F o r m e d   P a r e n t h e s e s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   R e c u r s i o n      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 G e n e r a t e   v a l i d   p a r e n t h e s e s .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 3  
  
 O u t p u t :  
 ( ( ( ) ) )  
 ( ( ) ( ) )  
 . . .  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   7 7 :   T h e   P o w e r   S e t   ( S u b s e t s )  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   R e c u r s i o n      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e t u r n   a l l   s u b s e t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   7 8 :   T h e   C o m b i n a t i o n   S u m  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   R e c u r s i o n      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o m b i n a t i o n   s u m   t o   t a r g e t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   7 9 :   T h e   P e r m u t a t i o n s   L i s t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   R e c u r s i o n      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e t u r n   a l l   p e r m u t a t i o n s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   8 0 :   T h e   N - Q u e e n s   C h a l l e n g e  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   R e c u r s i o n      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 N - Q u e e n s   s o l v e r .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 4  
  
 O u t p u t :  
 . Q . .  
 . . .  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   8 1 :   T h e   S u d o k u   S o l v e r  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   B a c k t r a c k i n g      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S o l v e   S u d o k u .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   8 2 :   T h e   W o r d   S e a r c h   G r i d  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B a c k t r a c k i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   w o r d   i n   g r i d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   8 3 :   T h e   R a t   i n   a   M a z e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B a c k t r a c k i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R a t   p a t h   f r o m   s t a r t   t o   e n d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   8 4 :   T h e   P a l i n d r o m e   P a r t i t i o n i n g  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B a c k t r a c k i n g      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P a r t i t i o n   s t r i n g   i n t o   p a l i n d r o m e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   8 5 :   T h e   P h o n e   K e y p a d   C o m b i n a t i o n s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B a c k t r a c k i n g      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L e t t e r   c o m b i n a t i o n s   o f   n u m b e r .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B a c k t r a c k i n g .  
  
 - - -  
  
 # #   P r o b l e m   8 6 :   T h e   I n o r d e r   T r a v e r s a l  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I n o r d e r   t r a v e r s a l .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 1   n u l l   2   3  
  
 O u t p u t :  
 1   3   2  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n / S t a c k .  
  
 - - -  
  
 # #   P r o b l e m   8 7 :   T h e   P r e o r d e r   T r a v e r s a l  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P r e o r d e r   t r a v e r s a l .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n / S t a c k .  
  
 - - -  
  
 # #   P r o b l e m   8 8 :   T h e   P o s t o r d e r   T r a v e r s a l  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P o s t o r d e r   t r a v e r s a l .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n / S t a c k .  
  
 - - -  
  
 # #   P r o b l e m   8 9 :   T h e   M a x   D e p t h  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   L i n k e d I n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   d e p t h   o f   t r e e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   9 0 :   T h e   T r e e   D i a m e t e r  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 D i a m e t e r   o f   t r e e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S   h e i g h t .  
  
 - - -  
  
 # #   P r o b l e m   9 1 :   T h e   B a l a n c e d   T r e e   C h e c k  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e c k   s p e c i f i c   h e i g h t   b a l a n c e d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   9 2 :   T h e   I d e n t i c a l   T r e e s  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e c k   i f   t w o   t r e e s   a r e   s a m e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n .  
  
 - - -  
  
 # #   P r o b l e m   9 3 :   T h e   S y m m e t r i c   S y m m e t r y  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e c k   m i r r o r   i m a g e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n .  
  
 - - -  
  
 # #   P r o b l e m   9 4 :   T h e   Z i g Z a g   T r a v e r s a l  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 Z i g Z a g   l e v e l   o r d e r .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S .  
  
 - - -  
  
 # #   P r o b l e m   9 5 :   T h e   L o w e s t   C o m m o n   A n c e s t o r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L C A   o f   b i n a r y   t r e e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   9 6 :   T h e   B S T   V a l i d a t o r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 V a l i d a t e   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i o n   r a n g e .  
  
 - - -  
  
 # #   P r o b l e m   9 7 :   T h e   L C A   i n   B S T  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L C A   i n   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e .  
  
 - - -  
  
 # #   P r o b l e m   9 8 :   T h e   B S T   S e a r c h  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S e a r c h   i n   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e .  
  
 - - -  
  
 # #   P r o b l e m   9 9 :   T h e   B a l a n c e d   B S T   C o n s t r u c t i o n  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   A i r b n b      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S o r t e d   a r r a y   t o   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i v e   m i d .  
  
 - - -  
  
 # #   P r o b l e m   1 0 0 :   T h e   T r e e   A r c h i t e c t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o n s t r u c t   t r e e   f r o m   p r e o r d e r   a n d   i n o r d e r .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e c u r s i v e .  
  
 - - -  
  
 - - -  
  
 # #   P r o b l e m   1 0 1 :   T h e   L i s t   F l a t t e n e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F l a t t e n   t r e e   t o   l i n k e d   l i s t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   R e v e r s e   P r e o r d e r .  
  
 - - -  
  
 # #   P r o b l e m   1 0 2 :   T h e   T r e e   S e r i a l i z e r  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   U b e r      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S e r i a l i z e   a n d   d e s e r i a l i z e   b i n a r y   t r e e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S / D F S   w i t h   n u l l s .  
  
 - - -  
  
 # #   P r o b l e m   1 0 3 :   T h e   M a x i m u m   P a t h   S u m  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   T r e e      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   p a t h   s u m   i n   t r e e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S   m a x   g a i n .  
  
 - - -  
  
 # #   P r o b l e m   1 0 4 :   T h e   K - t h   S m a l l e s t   E l e m e n t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 K t h   s m a l l e s t   i n   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I n o r d e r .  
  
 - - -  
  
 # #   P r o b l e m   1 0 5 :   T h e   T w o   S u m   P a i r   ( B S T )  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B S T      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 T w o   S u m   i n   B S T .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I n o r d e r   +   T w o   P o i n t e r s .  
  
 - - -  
  
 # #   P r o b l e m   1 0 6 :   T h e   P r o v i n c e   C o u n t e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u n t   c o n n e c t e d   c o m p o n e n t s   ( c i t i e s ) .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S / U n i o n   F i n d .  
  
 - - -  
  
 # #   P r o b l e m   1 0 7 :   T h e   I s l a n d   C o u n t e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u n t   i s l a n d s   i n   g r i d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S / B F S .  
  
 - - -  
  
 # #   P r o b l e m   1 0 8 :   T h e   F l o o d   F i l l  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F l o o d   f i l l   i m a g e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S .  
  
 - - -  
  
 # #   P r o b l e m   1 0 9 :   T h e   R o t t i n g   O r a n g e s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 T i m e   t o   r o t   a l l   o r a n g e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S .  
  
 - - -  
  
 # #   P r o b l e m   1 1 0 :   T h e   C y c l e   i n   U n d i r e c t e d   G r a p h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 D e t e c t   c y c l e   i n   u n d i r e c t e d   g r a p h .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S   p a r e n t   c h e c k .  
  
 - - -  
  
 # #   P r o b l e m   1 1 1 :   T h e   C y c l e   i n   D i r e c t e d   G r a p h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 D e t e c t   c y c l e   i n   d i r e c t e d   g r a p h .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D F S   r e c u r s i o n   s t a c k .  
  
 - - -  
  
 # #   P r o b l e m   1 1 2 :   T h e   C o u r s e   S c h e d u l e   I  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C a n   f i n i s h   c o u r s e s ?  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   C y c l e   D e t e c t i o n .  
  
 - - -  
  
 # #   P r o b l e m   1 1 3 :   T h e   C o u r s e   S c h e d u l e   I I  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u r s e   o r d e r i n g .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T o p o l o g i c a l   S o r t .  
  
 - - -  
  
 # #   P r o b l e m   1 1 4 :   T h e   E v e n t u a l   S a f e   S t a t e s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   s a f e   n o d e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   C y c l e   d e t e c t i o n .  
  
 - - -  
  
 # #   P r o b l e m   1 1 5 :   T h e   A l i e n   D i c t i o n a r y  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 O r d e r   o f   c h a r a c t e r s   i n   a l i e n   l a n g u a g e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T o p o l o g i c a l   S o r t .  
  
 - - -  
  
 # #   P r o b l e m   1 1 6 :   T h e   U n i t   W e i g h t   S h o r t e s t   P a t h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S h o r t e s t   p a t h   i n   u n i t   w e i g h t   g r a p h .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S .  
  
 - - -  
  
 # #   P r o b l e m   1 1 7 :   T h e   D A G   S h o r t e s t   P a t h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S h o r t e s t   p a t h   i n   D A G .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T o p o   S o r t .  
  
 - - -  
  
 # #   P r o b l e m   1 1 8 :   T h e   N e t w o r k   D e l a y   ( D i j k s t r a )  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 T i m e   f o r   s i g n a l   t o   r e a c h   a l l   n o d e s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D i j k s t r a .  
  
 - - -  
  
 # #   P r o b l e m   1 1 9 :   T h e   C h e a p e s t   F l i g h t s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A i r b n b      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e a p e s t   f l i g h t   w i t h   k   s t o p s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M o d i f i e d   D i j k s t r a / B e l l m a n   F o r d .  
  
 - - -  
  
 # #   P r o b l e m   1 2 0 :   T h e   A l l - P a i r s   S h o r t e s t   P a t h  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   S a m s u n g      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F l o y d   W a r s h a l l .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 2 1 :   T h e   M i n i m u m   C o n n e c t i o n   C o s t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   c o s t   t o   c o n n e c t   p o i n t s   ( M S T ) .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   P r i m ' s .  
  
 - - -  
  
 # #   P r o b l e m   1 2 2 :   T h e   N e t w o r k   R e c o n s t r u c t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 N u m b e r   o f   o p e r a t i o n s   t o   c o n n e c t   n e t w o r k .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   C o m p o n e n t s   -   1 .  
  
 - - -  
  
 # #   P r o b l e m   1 2 3 :   T h e   S t o n e   R e m o v a l  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   s t o n e s   r e m o v e d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D S U   c o m p o n e n t s .  
  
 - - -  
  
 # #   P r o b l e m   1 2 4 :   T h e   A c c o u n t   M e r g e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M e r g e   a c c o u n t s   w i t h   s a m e   e m a i l .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D S U .  
  
 - - -  
  
 # #   P r o b l e m   1 2 5 :   T h e   W o r d   L a d d e r  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   G r a p h      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 S h o r t e s t   t r a n s f o r m a t i o n   s e q u e n c e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S .  
  
 - - -  
  
 # #   P r o b l e m   1 2 6 :   T h e   S t a i r c a s e   C l i m b  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C l i m b   s t a i r s   w a y s .  
  
 # # #   E x a m p l e s  
  
 * * E x a m p l e   1 : * *  
 ` ` ` t e x t  
 I n p u t :  
 2  
  
 O u t p u t :  
 2  
 ` ` `  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   F i b o n a c c i .  
  
 - - -  
  
 # #   P r o b l e m   1 2 7 :   T h e   F i b o n a c c i   N u m b e r  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   S t a n d a r d      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 N t h   F i b o n a c c i .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   I t e r a t i v e .  
  
 - - -  
  
 # #   P r o b l e m   1 2 8 :   T h e   H o u s e   R o b b e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   r o b b e r y   n o n - a d j a c e n t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 2 9 :   T h e   R i n g   R o b b e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 H o u s e   r o b b e r   c i r c u l a r .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P   t w i c e .  
  
 - - -  
  
 # #   P r o b l e m   1 3 0 :   T h e   L o n g e s t   I n c r e a s i n g   S u b s e q u e n c e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L e n g t h   o f   L I S .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   O ( N   l o g   N ) .  
  
 - - -  
  
 # #   P r o b l e m   1 3 1 :   T h e   C o i n   C h a n g e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   c o i n s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 2 :   T h e   C o i n   C o m b i n a t i o n s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 W a y s   t o   m a k e   c h a n g e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 3 :   T h e   M a x i m u m   P r o d u c t   S u b a r r a y  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   p r o d u c t   c o n t i g u o u s   s u b a r r a y .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M a x / M i n   s o   f a r .  
  
 - - -  
  
 # #   P r o b l e m   1 3 4 :   T h e   S u b s e t   P a r t i t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P a r t i t i o n   i n t o   e q u a l   s u m   s u b s e t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   0 / 1   K n a p s a c k .  
  
 - - -  
  
 # #   P r o b l e m   1 3 5 :   T h e   D e c o d e   W a y s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 W a y s   t o   d e c o d e   s t r i n g   A - > 1 . . .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 6 :   T h e   U n i q u e   P a t h s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P a t h s   f r o m   t o p - l e f t   t o   b o t t o m - r i g h t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r i d   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 7 :   T h e   M i n i m u m   P a t h   S u m  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   s u m   p a t h   i n   g r i d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r i d   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 8 :   T h e   L o n g e s t   C o m m o n   S u b s e q u e n c e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L C S   l e n g t h .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   2 D   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 3 9 :   T h e   L o n g e s t   P a l i n d r o m i c   S u b s e q u e n c e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 L P S   l e n g t h .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 0 :   T h e   E d i t   D i s t a n c e  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   o p s   t o   c o n v e r t   w o r d 1   t o   w o r d 2 .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   2 D   D P .  
  
 - - -  
  
 - - -  
  
 # #   P r o b l e m   1 4 1 :   T h e   M a x i m a l   S q u a r e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   A p p l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   a r e a   s q u a r e   o f   1 s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r i d   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 2 :   T h e   D i s t i n c t   S u b s e q u e n c e s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u n t   d i s t i n c t   s u b s e q u e n c e s   o f   s   e q u a l s   t .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 3 :   T h e   S t o c k   w i t h   C o o l d o w n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   p r o f i t   w i t h   c o o l d o w n .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   S t a t e   m a c h i n e   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 4 :   T h e   I n t e r l e a v i n g   S t r i n g  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C h e c k   i n t e r l e a v e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   2 D   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 5 :   T h e   B u r s t   B a l l o o n s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   D P      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   c o i n s   b u r s t i n g   b a l l o o n s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M C M   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 4 6 :   N o t e   t h e   P r e f i x  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r i e      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 I m p l e m e n t   T r i e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T r i e N o d e   c h i l d r e n   a r r a y .  
  
 - - -  
  
 # #   P r o b l e m   1 4 7 :   T h e   W o r d   D i c t i o n a r y  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r i e      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 D e s i g n   W o r d D i c t i o n a r y   w i t h   d o t   w i l d c a r d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T r i e   w i t h   D F S .  
  
 - - -  
  
 # #   P r o b l e m   1 4 8 :   T h e   W o r d   S e a r c h   I I  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   T r i e      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   a l l   w o r d s   i n   g r i d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T r i e   +   D F S .  
  
 - - -  
  
 # #   P r o b l e m   1 4 9 :   T h e   M a x i m u m   X O R   P a i r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   T r i e      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M a x   X O R   o f   t w o   n u m b e r s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i t w i s e   T r i e .  
  
 - - -  
  
 # #   P r o b l e m   1 5 0 :   T h e   K - t h   L a r g e s t   E l e m e n t  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   H e a p      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 K t h   l a r g e s t   e l e m e n t   i n   a r r a y .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M i n   H e a p .  
  
 - - -  
  
 # #   P r o b l e m   1 5 1 :   T h e   T o p   K   F r e q u e n t   E l e m e n t s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   H e a p      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 T o p   k   f r e q u e n t   n u m b e r s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B u c k e t   S o r t   /   H e a p .  
  
 - - -  
  
 # #   P r o b l e m   1 5 2 :   T h e   M e d i a n   S t r e a m  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   H e a p      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M e d i a n   f r o m   d a t a   s t r e a m .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   T w o   H e a p s .  
  
 - - -  
  
 # #   P r o b l e m   1 5 3 :   T h e   M e r g e   K   S o r t e d   L i s t s  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   H e a p      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M e r g e   k   s o r t e d   l i s t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M i n   H e a p .  
  
 - - -  
  
 # #   P r o b l e m   1 5 4 :   T h e   T a s k   S c h e d u l e r  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r e e d y      
 * * A s k e d   I n : * *   F a c e b o o k      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   u n i t s   t o   f i n i s h   t a s k s   w i t h   c o o l d o w n .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r e e d y   m a t h .  
  
 - - -  
  
 # #   P r o b l e m   1 5 5 :   T h e   S t r i n g   R e o r g a n i z a t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   H e a p      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e a r r a n g e   l o g i c   n o   a d j a c e n t   s a m e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   M a x   H e a p .  
  
 - - -  
  
 # #   P r o b l e m   1 5 6 :   T h e   S i n g l e   N u m b e r  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B i t   M a n i p u l a t i o n      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 F i n d   e l e m e n t   a p p e a r i n g   o n c e .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   X O R .  
  
 - - -  
  
 # #   P r o b l e m   1 5 7 :   T h e   H a m m i n g   W e i g h t  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B i t   M a n i p u l a t i o n      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 N u m b e r   o f   1   b i t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   n   &   ( n - 1 ) .  
  
 - - -  
  
 # #   P r o b l e m   1 5 8 :   T h e   B i t   C o u n t i n g  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B i t   M a n i p u l a t i o n      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C o u n t   b i t s   f o r   r a n g e   0   t o   n .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   D P .  
  
 - - -  
  
 # #   P r o b l e m   1 5 9 :   T h e   R e v e r s e   B i t s  
 * * D i f f i c u l t y : * *   E a s y      
 * * T o p i c : * *   B i t   M a n i p u l a t i o n      
 * * A s k e d   I n : * *   A p p l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 R e v e r s e   b i t s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i t w i s e   s h i f t .  
  
 - - -  
  
 # #   P r o b l e m   1 6 0 :   T h e   J u m p   G a m e  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r e e d y      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C a n   r e a c h   e n d ?  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r e e d y   m a x   r e a c h .  
  
 - - -  
  
 # #   P r o b l e m   1 6 1 :   T h e   M i n i m u m   J u m p s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r e e d y      
 * * A s k e d   I n : * *   A m a z o n      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   j u m p s   t o   r e a c h   e n d .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B F S   G r e e d y .  
  
 - - -  
  
 # #   P r o b l e m   1 6 2 :   T h e   G a s   S t a t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   G r e e d y      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 C i r c u i t   c o m p l e t i o n   c h e c k .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   G r e e d y   d i f f   s u m .  
  
 - - -  
  
 # #   P r o b l e m   1 6 3 :   T h e   C a n d y   D i s t r i b u t i o n  
 * * D i f f i c u l t y : * *   H a r d      
 * * T o p i c : * *   G r e e d y      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 M i n   c a n d i e s   f o r   r a t i n g s .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   L e f t / R i g h t   p a s s .  
  
 - - -  
  
 # #   P r o b l e m   1 6 4 :   T h e   P o w e r   F u n c t i o n  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t h      
 * * A s k e d   I n : * *   G o o g l e      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 P o w ( x ,   n ) .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   B i n a r y   E x p o n e n t i a t i o n .  
  
 - - -  
  
 # #   P r o b l e m   1 6 5 :   T h e   T r a i l i n g   Z e r o e s  
 * * D i f f i c u l t y : * *   M e d i u m      
 * * T o p i c : * *   M a t h      
 * * A s k e d   I n : * *   M i c r o s o f t      
  
 # # #   P r o b l e m   D e s c r i p t i o n  
 T r a i l i n g   z e r o e s   i n   f a c t o r i a l .  
  
 # # #   S o l u t i o n   E x p e c t a t i o n  
 -   * * A p p r o a c h : * *   C o u n t   f a c t o r s   o f   5 .  
  
 - - -  
 


---

## Problem 36: The Anagram Grouping
**Difficulty:** Medium  
**Topic:** Strings, Hashing  
**Asked In:** Amazon, Microsoft, Goldman Sachs  

### Problem Description
Given an array of strings, group the **anagrams** together. You can return the answer in any order.

**Constraints:**
- `1 <= strs.length <= 10^4`
- `0 <= strs[i].length <= 100`

### Input Format
- An integer `n`.
- `n` strings.

### Output Format
- Groups of strings.

### Examples

**Example 1:**
```text
Input:
6
eat tea tan ate nat bat

Output:
bat
nat tan
ate eat tea
```

### Solution Expectation
- **Approach:** Map `{sorted_string -> list}`.

---

## Problem 37: The Longest Palindromic Substring
**Difficulty:** Medium  
**Topic:** Strings, DP  
**Asked In:** Amazon, Microsoft, Google  

### Problem Description
Given a string `s`, return the **longest palindromic substring** in `s`.

**Constraints:**
- `1 <= s.length <= 1000`

### Input Format
- A string `s`.

### Output Format
- The substring.

### Examples

**Example 1:**
```text
Input:
babad

Output:
bab
```

### Solution Expectation
- **Approach:** Expand around center O(N^2).

---

## Problem 38: The Palindromic Count
**Difficulty:** Medium  
**Topic:** Strings, DP  
**Asked In:** Facebook, LinkedIn  

### Problem Description
Given a string `s`, determine the **number of palindromic substrings** in it.

### Input Format
- A string `s`.

### Output Format
- Integer count.

### Examples

**Example 1:**
```text
Input:
abc

Output:
3
```

### Solution Expectation
- **Approach:** Expand around center.

---

## Problem 39: The Permutation Inclusion
**Difficulty:** Medium  
**Topic:** Strings, Sliding Window  
**Asked In:** Microsoft, Amazon  

### Problem Description
Given two strings `s1` and `s2`, return `true` if `s2` contains a **permutation** of `s1`.

### Examples

**Example 1:**
```text
Input:
ab
eidbaooo

Output:
true
```

### Solution Expectation
- **Approach:** Sliding Window of size `len(s1)` with frequency map.

---

## Problem 40: The Distinct Palindromic Sequences
**Difficulty:** Hard  
**Topic:** Strings, DP  
**Asked In:** Google, LinkedIn  

### Problem Description
Given a string `s`, find the number of **different non-empty palindromic subsequences** in `s`, modulo `10^9 + 7`.

### Examples

**Example 1:**
```text
Input:
bccb

Output:
6
```

### Solution Expectation
- **Approach:** DP `dp[i][j]`.

---

## Problem 41: The Smallest Window Cover
**Difficulty:** Hard  
**Topic:** Strings, Sliding Window  
**Asked In:** Google, Amazon  

### Problem Description
Given two strings `s` and `t`, return the **minimum window substring** of `s` such that every character in `t` (including duplicates) is included in the window.

### Examples

**Example 1:**
```text
Input:
ADOBECODEBANC
ABC

Output:
BANC
```

### Solution Expectation
- **Approach:** Sliding Window.

---

## Problem 42: The Wildcard Pattern
**Difficulty:** Hard  
**Topic:** Strings, DP  
**Asked In:** Google, Microsoft  

### Problem Description
Given an input string `s` and a pattern `p`, implement wildcard pattern matching with support for `'?'` and `'*'`.

### Examples

**Example 1:**
```text
Input:
aa
*

Output:
true
```

### Solution Expectation
- **Approach:** DP.

---

## Problem 43: The Pattern Search (KMP)
**Difficulty:** Medium  
**Topic:** Strings, KMP  
**Asked In:** Microsoft  

### Problem Description
Implement KMP algorithm to find first occurrence of `pat` in `txt`.

### Solution Expectation
- **Approach:** KMP.

---

## Problem 44: The Rolling Hash (Rabin-Karp)
**Difficulty:** Hard  
**Topic:** Strings  
**Asked In:** Google  

### Problem Description
Implement Rabin-Karp to find all occurrences.

### Solution Expectation
- **Approach:** Rolling Hash.

---

## Problem 45: The Minimal Operations Transformation
**Difficulty:** Hard  
**Topic:** Strings  
**Asked In:** Google  

### Problem Description
Min operations to convert A to B by moving char to front.

### Solution Expectation
- **Approach:** Backwards matching.

---

# Interview DSA Course - Module 3: Searching & Sorting

---

## Problem 46: The Occurrence Finder
**Difficulty:** Medium  
**Topic:** Searching  
**Asked In:** Amazon  

### Problem Description
Find first and last position of element in sorted array.

### Examples

**Example 1:**
```text
Input:
6
5 7 7 8 8 10
8

Output:
3 4
```

### Solution Expectation
- **Approach:** Binary Search twice.

---

## Problem 47: The Rotated Search II
**Difficulty:** Medium  
**Topic:** Searching  
**Asked In:** Adobe  

### Problem Description
Search in rotated sorted array with duplicates.

### Solution Expectation
- **Approach:** Binary Search with duplicate handling.

---

## Problem 48: The Precise Root
**Difficulty:** Easy  
**Topic:** Searching  
**Asked In:** Amazon  

### Problem Description
Compute square root of x.

### Solution Expectation
- **Approach:** Binary Search.

---

## Problem 49: The Majority Consensus
**Difficulty:** Easy  
**Topic:** Arrays, Sorting  
**Asked In:** Amazon, Google  

### Problem Description
Find majority element (> n/2).

### Solution Expectation
- **Approach:** Moore's Voting.

---

## Problem 50: The Peak Identification
**Difficulty:** Medium  
**Topic:** Searching  
**Asked In:** Google  

### Problem Description
Find peak element index.

### Solution Expectation
- **Approach:** Binary Search.

---

## Problem 51: The Inversion Count
**Difficulty:** Hard  
**Topic:** Sorting  
**Asked In:** Amazon  

### Problem Description
Count inversions in array.

### Solution Expectation
- **Approach:** Merge Sort.

---

## Problem 52: The Quick Partition
**Difficulty:** Medium  
**Topic:** Sorting  
**Asked In:** Standard  

### Problem Description
Implement Quick Sort Partition.

### Solution Expectation
- **Approach:** Pivot logic.

---

## Problem 53: The Book Allocator
**Difficulty:** Hard  
**Topic:** Binary Search  
**Asked In:** Google  

### Problem Description
Minimize max pages allocated to students.

### Solution Expectation
- **Approach:** Binary Search on Answer.

---

## Problem 54: The Aggressive Herders
**Difficulty:** Hard  
**Topic:** Binary Search  
**Asked In:** SPOJ  

### Problem Description
Largest minimum distance between cows.

### Solution Expectation
- **Approach:** Binary Search on Answer.

---

## Problem 55: The Median of Sorted Arrays
**Difficulty:** Hard  
**Topic:** Binary Search  
**Asked In:** Google  

### Problem Description
Find median of two sorted arrays.

### Solution Expectation
- **Approach:** Partitioning.

---



---

## Problem 56: The Spiral Traversal
**Difficulty:** Medium  
**Topic:** Matrix  
**Asked In:** Microsoft  

### Problem Description
Return all elements of matrix in spiral order.

### Examples

**Example 1:**
```text
Input:
3 3
1 2 3
4 5 6
7 8 9

Output:
1 2 3 6 9 8 7 4 5
```

### Solution Expectation
- **Approach:** Simulation.

---

## Problem 57: The Matrix Zero Setter
**Difficulty:** Medium  
**Topic:** Matrix  
**Asked In:** Amazon  

### Problem Description
Set row and col to 0 if element is 0.

### Solution Expectation
- **Approach:** Use first row/col as markers.

---

## Problem 58: The Image Rotation
**Difficulty:** Medium  
**Topic:** Matrix  
**Asked In:** Amazon  

### Problem Description
Rotate image by 90 degrees clockwise.

### Solution Expectation
- **Approach:** Transpose then reverse rows.

---

## Problem 59: The 2D Search
**Difficulty:** Medium  
**Topic:** Matrix  
**Asked In:** Amazon  

### Problem Description
Search target in sorted matrix.

### Solution Expectation
- **Approach:** Binary Search.

---

## Problem 60: The Row with Maximum Ones
**Difficulty:** Medium  
**Topic:** Matrix  
**Asked In:** Amazon  

### Problem Description
Find row with max 1s.

### Solution Expectation
- **Approach:** Top-right start.

---

## Problem 61: The Linked List Reversal
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Adobe  

### Problem Description
Reverse a singly linked list.

### Examples

**Example 1:**
```text
Input:
1 2 3

Output:
3 2 1
```

### Solution Expectation
- **Approach:** Iterative.

---

## Problem 62: The Middle Node
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Flipkart  

### Problem Description
Find middle of linked list.

### Solution Expectation
- **Approach:** Tortoise and Hare.

---

## Problem 63: The Sorted Merger
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Merge two sorted lists.

### Solution Expectation
- **Approach:** Iterative.

---

## Problem 64: The N-th Removal
**Difficulty:** Medium  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Remove nth node from end.

### Solution Expectation
- **Approach:** Two pointers.

---

## Problem 65: The Cycle Detector
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Detect cycle in list.

### Examples

**Example 1:**
```text
Input:
3 2 0 -4
pos=1

Output:
true
```

### Solution Expectation
- **Approach:** Floyd's Cycle.

---

## Problem 66: The Shared Node Intersection
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Find intersection node.

### Solution Expectation
- **Approach:** Two pointers switching heads.

---

## Problem 67: The Palindromic List
**Difficulty:** Easy  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Check if list is palindrome.

### Solution Expectation
- **Approach:** Reverse half.

---

## Problem 68: The Cycle Start Point
**Difficulty:** Medium  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Return node where cycle begins.

### Solution Expectation
- **Approach:** Floyd's.

---

## Problem 69: The K-Group Reversal
**Difficulty:** Hard  
**Topic:** Linked List  
**Asked In:** Microsoft  

### Problem Description
Reverse nodes in k-group.

### Solution Expectation
- **Approach:** Iterative group reversal.

---

## Problem 70: The Cloned List
**Difficulty:** Medium  
**Topic:** Linked List  
**Asked In:** Amazon  

### Problem Description
Clone list with random pointers.

### Solution Expectation
- **Approach:** Interweave or Map.

---

## Problem 71: The Minimum Element Stack
**Difficulty:** Medium  
**Topic:** Stack  
**Asked In:** Amazon  

### Problem Description
Stack with getMin().

### Solution Expectation
- **Approach:** Two stacks.

---

## Problem 72: Queue via Stacks
**Difficulty:** Easy  
**Topic:** Stack  
**Asked In:** Amazon  

### Problem Description
Implement Queue using Stacks.

### Solution Expectation
- **Approach:** Two stacks.

---

## Problem 73: The Next Greater Element
**Difficulty:** Medium  
**Topic:** Stack  
**Asked In:** Amazon  

### Problem Description
Find next greater element.

### Solution Expectation
- **Approach:** Monotonic Stack.

---

## Problem 74: The Histogram Area
**Difficulty:** Hard  
**Topic:** Stack  
**Asked In:** Google  

### Problem Description
Largest rectangle in histogram.

### Solution Expectation
- **Approach:** Monotonic Stack.

---

## Problem 75: The Sliding Window Maximum
**Difficulty:** Hard  
**Topic:** Queue  
**Asked In:** Google  

### Problem Description
Max in sliding window.

### Solution Expectation
- **Approach:** Monotonic Deque.

---

## Problem 76: The Well-Formed Parentheses
**Difficulty:** Medium  
**Topic:** Recursion  
**Asked In:** Amazon  

### Problem Description
Generate valid parentheses.

### Examples

**Example 1:**
```text
Input:
3

Output:
((()))
(()())
...
```

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 77: The Power Set (Subsets)
**Difficulty:** Medium  
**Topic:** Recursion  
**Asked In:** Facebook  

### Problem Description
Return all subsets.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 78: The Combination Sum
**Difficulty:** Medium  
**Topic:** Recursion  
**Asked In:** Amazon  

### Problem Description
Combination sum to target.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 79: The Permutations List
**Difficulty:** Medium  
**Topic:** Recursion  
**Asked In:** Microsoft  

### Problem Description
Return all permutations.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 80: The N-Queens Challenge
**Difficulty:** Hard  
**Topic:** Recursion  
**Asked In:** Amazon  

### Problem Description
N-Queens solver.

### Examples

**Example 1:**
```text
Input:
4

Output:
.Q..
...
```

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 81: The Sudoku Solver
**Difficulty:** Hard  
**Topic:** Backtracking  
**Asked In:** Microsoft  

### Problem Description
Solve Sudoku.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 82: The Word Search Grid
**Difficulty:** Medium  
**Topic:** Backtracking  
**Asked In:** Amazon  

### Problem Description
Find word in grid.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 83: The Rat in a Maze
**Difficulty:** Medium  
**Topic:** Backtracking  
**Asked In:** Amazon  

### Problem Description
Rat path from start to end.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 84: The Palindrome Partitioning
**Difficulty:** Medium  
**Topic:** Backtracking  
**Asked In:** Google  

### Problem Description
Partition string into palindromes.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 85: The Phone Keypad Combinations
**Difficulty:** Medium  
**Topic:** Backtracking  
**Asked In:** Amazon  

### Problem Description
Letter combinations of number.

### Solution Expectation
- **Approach:** Backtracking.

---

## Problem 86: The Inorder Traversal
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Inorder traversal.

### Examples

**Example 1:**
```text
Input:
1 null 2 3

Output:
1 3 2
```

### Solution Expectation
- **Approach:** Recursion/Stack.

---

## Problem 87: The Preorder Traversal
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Preorder traversal.

### Solution Expectation
- **Approach:** Recursion/Stack.

---

## Problem 88: The Postorder Traversal
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Postorder traversal.

### Solution Expectation
- **Approach:** Recursion/Stack.

---

## Problem 89: The Max Depth
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** LinkedIn  

### Problem Description
Max depth of tree.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 90: The Tree Diameter
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Diameter of tree.

### Solution Expectation
- **Approach:** DFS height.

---

## Problem 91: The Balanced Tree Check
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Check specific height balanced.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 92: The Identical Trees
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Check if two trees are same.

### Solution Expectation
- **Approach:** Recursion.

---

## Problem 93: The Symmetric Symmetry
**Difficulty:** Easy  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Check mirror image.

### Solution Expectation
- **Approach:** Recursion.

---

## Problem 94: The ZigZag Traversal
**Difficulty:** Medium  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
ZigZag level order.

### Solution Expectation
- **Approach:** BFS.

---

## Problem 95: The Lowest Common Ancestor
**Difficulty:** Medium  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
LCA of binary tree.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 96: The BST Validator
**Difficulty:** Medium  
**Topic:** BST  
**Asked In:** Amazon  

### Problem Description
Validate BST.

### Solution Expectation
- **Approach:** Recursion range.

---

## Problem 97: The LCA in BST
**Difficulty:** Easy  
**Topic:** BST  
**Asked In:** Amazon  

### Problem Description
LCA in BST.

### Solution Expectation
- **Approach:** Iterative.

---

## Problem 98: The BST Search
**Difficulty:** Easy  
**Topic:** BST  
**Asked In:** Amazon  

### Problem Description
Search in BST.

### Solution Expectation
- **Approach:** Iterative.

---

## Problem 99: The Balanced BST Construction
**Difficulty:** Easy  
**Topic:** BST  
**Asked In:** Airbnb  

### Problem Description
Sorted array to BST.

### Solution Expectation
- **Approach:** Recursive mid.

---

## Problem 100: The Tree Architect
**Difficulty:** Medium  
**Topic:** Tree  
**Asked In:** Amazon  

### Problem Description
Construct tree from preorder and inorder.

### Solution Expectation
- **Approach:** Recursive.

---



---

## Problem 101: The List Flattener
**Difficulty:** Medium  
**Topic:** Tree  
**Asked In:** Microsoft  

### Problem Description
Flatten tree to linked list.

### Solution Expectation
- **Approach:** Reverse Preorder.

---

## Problem 102: The Tree Serializer
**Difficulty:** Hard  
**Topic:** Tree  
**Asked In:** Uber  

### Problem Description
Serialize and deserialize binary tree.

### Solution Expectation
- **Approach:** BFS/DFS with nulls.

---

## Problem 103: The Maximum Path Sum
**Difficulty:** Hard  
**Topic:** Tree  
**Asked In:** Facebook  

### Problem Description
Max path sum in tree.

### Solution Expectation
- **Approach:** DFS max gain.

---

## Problem 104: The K-th Smallest Element
**Difficulty:** Medium  
**Topic:** BST  
**Asked In:** Google  

### Problem Description
Kth smallest in BST.

### Solution Expectation
- **Approach:** Inorder.

---

## Problem 105: The Two Sum Pair (BST)
**Difficulty:** Easy  
**Topic:** BST  
**Asked In:** Amazon  

### Problem Description
Two Sum in BST.

### Solution Expectation
- **Approach:** Inorder + Two Pointers.

---

## Problem 106: The Province Counter
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Count connected components (cities).

### Solution Expectation
- **Approach:** DFS/Union Find.

---

## Problem 107: The Island Counter
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Count islands in grid.

### Solution Expectation
- **Approach:** DFS/BFS.

---

## Problem 108: The Flood Fill
**Difficulty:** Easy  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Flood fill image.

### Solution Expectation
- **Approach:** DFS.

---

## Problem 109: The Rotting Oranges
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Time to rot all oranges.

### Solution Expectation
- **Approach:** BFS.

---

## Problem 110: The Cycle in Undirected Graph
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Detect cycle in undirected graph.

### Solution Expectation
- **Approach:** DFS parent check.

---

## Problem 111: The Cycle in Directed Graph
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Detect cycle in directed graph.

### Solution Expectation
- **Approach:** DFS recursion stack.

---

## Problem 112: The Course Schedule I
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Can finish courses?

### Solution Expectation
- **Approach:** Cycle Detection.

---

## Problem 113: The Course Schedule II
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Course ordering.

### Solution Expectation
- **Approach:** Topological Sort.

---

## Problem 114: The Eventual Safe States
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Find safe nodes.

### Solution Expectation
- **Approach:** Cycle detection.

---

## Problem 115: The Alien Dictionary
**Difficulty:** Hard  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Order of characters in alien language.

### Solution Expectation
- **Approach:** Topological Sort.

---

## Problem 116: The Unit Weight Shortest Path
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Shortest path in unit weight graph.

### Solution Expectation
- **Approach:** BFS.

---

## Problem 117: The DAG Shortest Path
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Shortest path in DAG.

### Solution Expectation
- **Approach:** Topo Sort.

---

## Problem 118: The Network Delay (Dijkstra)
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Time for signal to reach all nodes.

### Solution Expectation
- **Approach:** Dijkstra.

---

## Problem 119: The Cheapest Flights
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Airbnb  

### Problem Description
Cheapest flight with k stops.

### Solution Expectation
- **Approach:** Modified Dijkstra/Bellman Ford.

---

## Problem 120: The All-Pairs Shortest Path
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Samsung  

### Problem Description
Floyd Warshall.

### Solution Expectation
- **Approach:** DP.

---

## Problem 121: The Minimum Connection Cost
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Min cost to connect points (MST).

### Solution Expectation
- **Approach:** Prim's.

---

## Problem 122: The Network Reconstruction
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Number of operations to connect network.

### Solution Expectation
- **Approach:** Components - 1.

---

## Problem 123: The Stone Removal
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Google  

### Problem Description
Max stones removed.

### Solution Expectation
- **Approach:** DSU components.

---

## Problem 124: The Account Merge
**Difficulty:** Medium  
**Topic:** Graph  
**Asked In:** Facebook  

### Problem Description
Merge accounts with same email.

### Solution Expectation
- **Approach:** DSU.

---

## Problem 125: The Word Ladder
**Difficulty:** Hard  
**Topic:** Graph  
**Asked In:** Amazon  

### Problem Description
Shortest transformation sequence.

### Solution Expectation
- **Approach:** BFS.

---

## Problem 126: The Staircase Climb
**Difficulty:** Easy  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Climb stairs ways.

### Examples

**Example 1:**
```text
Input:
2

Output:
2
```

### Solution Expectation
- **Approach:** Fibonacci.

---

## Problem 127: The Fibonacci Number
**Difficulty:** Easy  
**Topic:** DP  
**Asked In:** Standard  

### Problem Description
Nth Fibonacci.

### Solution Expectation
- **Approach:** Iterative.

---

## Problem 128: The House Robber
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Max robbery non-adjacent.

### Solution Expectation
- **Approach:** DP.

---

## Problem 129: The Ring Robber
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Microsoft  

### Problem Description
House robber circular.

### Solution Expectation
- **Approach:** DP twice.

---

## Problem 130: The Longest Increasing Subsequence
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Microsoft  

### Problem Description
Length of LIS.

### Solution Expectation
- **Approach:** O(N log N).

---

## Problem 131: The Coin Change
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Min coins.

### Solution Expectation
- **Approach:** DP.

---

## Problem 132: The Coin Combinations
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Ways to make change.

### Solution Expectation
- **Approach:** DP.

---

## Problem 133: The Maximum Product Subarray
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Max product contiguous subarray.

### Solution Expectation
- **Approach:** Max/Min so far.

---

## Problem 134: The Subset Partition
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Partition into equal sum subsets.

### Solution Expectation
- **Approach:** 0/1 Knapsack.

---

## Problem 135: The Decode Ways
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Facebook  

### Problem Description
Ways to decode string A->1...

### Solution Expectation
- **Approach:** DP.

---

## Problem 136: The Unique Paths
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Paths from top-left to bottom-right.

### Solution Expectation
- **Approach:** Grid DP.

---

## Problem 137: The Minimum Path Sum
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
Min sum path in grid.

### Solution Expectation
- **Approach:** Grid DP.

---

## Problem 138: The Longest Common Subsequence
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
LCS length.

### Solution Expectation
- **Approach:** 2D DP.

---

## Problem 139: The Longest Palindromic Subsequence
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Amazon  

### Problem Description
LPS length.

### Solution Expectation
- **Approach:** DP.

---

## Problem 140: The Edit Distance
**Difficulty:** Hard  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Min ops to convert word1 to word2.

### Solution Expectation
- **Approach:** 2D DP.

---



---

## Problem 141: The Maximal Square
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Apple  

### Problem Description
Max area square of 1s.

### Solution Expectation
- **Approach:** Grid DP.

---

## Problem 142: The Distinct Subsequences
**Difficulty:** Hard  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Count distinct subsequences of s equals t.

### Solution Expectation
- **Approach:** DP.

---

## Problem 143: The Stock with Cooldown
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Max profit with cooldown.

### Solution Expectation
- **Approach:** State machine DP.

---

## Problem 144: The Interleaving String
**Difficulty:** Medium  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Check interleave.

### Solution Expectation
- **Approach:** 2D DP.

---

## Problem 145: The Burst Balloons
**Difficulty:** Hard  
**Topic:** DP  
**Asked In:** Google  

### Problem Description
Max coins bursting balloons.

### Solution Expectation
- **Approach:** MCM DP.

---

## Problem 146: Note the Prefix
**Difficulty:** Medium  
**Topic:** Trie  
**Asked In:** Amazon  

### Problem Description
Implement Trie.

### Solution Expectation
- **Approach:** TrieNode children array.

---

## Problem 147: The Word Dictionary
**Difficulty:** Medium  
**Topic:** Trie  
**Asked In:** Facebook  

### Problem Description
Design WordDictionary with dot wildcard.

### Solution Expectation
- **Approach:** Trie with DFS.

---

## Problem 148: The Word Search II
**Difficulty:** Hard  
**Topic:** Trie  
**Asked In:** Microsoft  

### Problem Description
Find all words in grid.

### Solution Expectation
- **Approach:** Trie + DFS.

---

## Problem 149: The Maximum XOR Pair
**Difficulty:** Medium  
**Topic:** Trie  
**Asked In:** Google  

### Problem Description
Max XOR of two numbers.

### Solution Expectation
- **Approach:** Bitwise Trie.

---

## Problem 150: The K-th Largest Element
**Difficulty:** Medium  
**Topic:** Heap  
**Asked In:** Facebook  

### Problem Description
Kth largest element in array.

### Solution Expectation
- **Approach:** Min Heap.

---

## Problem 151: The Top K Frequent Elements
**Difficulty:** Medium  
**Topic:** Heap  
**Asked In:** Amazon  

### Problem Description
Top k frequent numbers.

### Solution Expectation
- **Approach:** Bucket Sort / Heap.

---

## Problem 152: The Median Stream
**Difficulty:** Hard  
**Topic:** Heap  
**Asked In:** Google  

### Problem Description
Median from data stream.

### Solution Expectation
- **Approach:** Two Heaps.

---

## Problem 153: The Merge K Sorted Lists
**Difficulty:** Hard  
**Topic:** Heap  
**Asked In:** Facebook  

### Problem Description
Merge k sorted lists.

### Solution Expectation
- **Approach:** Min Heap.

---

## Problem 154: The Task Scheduler
**Difficulty:** Medium  
**Topic:** Greedy  
**Asked In:** Facebook  

### Problem Description
Min units to finish tasks with cooldown.

### Solution Expectation
- **Approach:** Greedy math.

---

## Problem 155: The String Reorganization
**Difficulty:** Medium  
**Topic:** Heap  
**Asked In:** Amazon  

### Problem Description
Rearrange logic no adjacent same.

### Solution Expectation
- **Approach:** Max Heap.

---

## Problem 156: The Single Number
**Difficulty:** Easy  
**Topic:** Bit Manipulation  
**Asked In:** Amazon  

### Problem Description
Find element appearing once.

### Solution Expectation
- **Approach:** XOR.

---

## Problem 157: The Hamming Weight
**Difficulty:** Easy  
**Topic:** Bit Manipulation  
**Asked In:** Microsoft  

### Problem Description
Number of 1 bits.

### Solution Expectation
- **Approach:** n & (n-1).

---

## Problem 158: The Bit Counting
**Difficulty:** Easy  
**Topic:** Bit Manipulation  
**Asked In:** Amazon  

### Problem Description
Count bits for range 0 to n.

### Solution Expectation
- **Approach:** DP.

---

## Problem 159: The Reverse Bits
**Difficulty:** Easy  
**Topic:** Bit Manipulation  
**Asked In:** Apple  

### Problem Description
Reverse bits.

### Solution Expectation
- **Approach:** Bitwise shift.

---

## Problem 160: The Jump Game
**Difficulty:** Medium  
**Topic:** Greedy  
**Asked In:** Amazon  

### Problem Description
Can reach end?

### Solution Expectation
- **Approach:** Greedy max reach.

---

## Problem 161: The Minimum Jumps
**Difficulty:** Medium  
**Topic:** Greedy  
**Asked In:** Amazon  

### Problem Description
Min jumps to reach end.

### Solution Expectation
- **Approach:** BFS Greedy.

---

## Problem 162: The Gas Station
**Difficulty:** Medium  
**Topic:** Greedy  
**Asked In:** Google  

### Problem Description
Circuit completion check.

### Solution Expectation
- **Approach:** Greedy diff sum.

---

## Problem 163: The Candy Distribution
**Difficulty:** Hard  
**Topic:** Greedy  
**Asked In:** Google  

### Problem Description
Min candies for ratings.

### Solution Expectation
- **Approach:** Left/Right pass.

---

## Problem 164: The Power Function
**Difficulty:** Medium  
**Topic:** Math  
**Asked In:** Google  

### Problem Description
Pow(x, n).

### Solution Expectation
- **Approach:** Binary Exponentiation.

---

## Problem 165: The Trailing Zeroes
**Difficulty:** Medium  
**Topic:** Math  
**Asked In:** Microsoft  

### Problem Description
Trailing zeroes in factorial.

### Solution Expectation
- **Approach:** Count factors of 5.

---


