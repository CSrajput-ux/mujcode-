# MujCode Automated 500-User Certification & Test Run Report

**Execution Timestamp:** 2026-09-30T04:29:36.640Z

## 1. Summary of Graduated Load Suite

| Users | Requests | Successful | Failed | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error % |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 258 | 174 | 84 | 51.54 | 1.38 | 13.56 | 32.35 | 36.47 | 32.56% |
| 5 | 931 | 678 | 253 | 185.35 | 1.72 | 17.35 | 21.3 | 32.32 | 27.18% |
| 10 | 1632 | 843 | 789 | 324.84 | 1.62 | 16.69 | 21.36 | 38.61 | 48.35% |
| 25 | 4319 | 3295 | 1024 | 714.71 | 8.54 | 25.82 | 36.23 | 53.19 | 23.71% |
| 50 | 6976 | 5575 | 1401 | 865.83 | 20.41 | 48.06 | 63.75 | 93.88 | 20.08% |
| 100 | 6175 | 5327 | 848 | 764.14 | 67.29 | 122.47 | 171.09 | 262.1 | 13.73% |
| 250 | 7692 | 6962 | 730 | 748.83 | 203 | 301.69 | 337.73 | 472.19 | 9.49% |
| 350 | 8055 | 7290 | 765 | 780.07 | 305.33 | 420.75 | 564.79 | 786.81 | 9.5% |
| 400 | 9511 | 8731 | 780 | 910.93 | 296.57 | 407.1 | 442.64 | 552.63 | 8.2% |
| 500 | 9277 | 8163 | 1114 | 433.18 | 448.16 | 647.47 | 2782.61 | 11111.49 | 12.01% |

## 2. 500-User Three-Run Reproducibility Suite

| Run | Concurrency | Requests | Actual RPS | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Errors |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Run 1 | 500 | 10267 | 412.86 | 544.89 | 794.62 | 1307.36 | 11195.61 | 1771 |
| Run 2 | 500 | 11264 | 451.86 | 479.32 | 661.86 | 1216.59 | 10939.59 | 1901 |
| Run 3 | 500 | 11209 | 449.31 | 478.43 | 769.92 | 1188.49 | 10960.73 | 1944 |

- **RPS Mean:** 438.01 (CV: 4.07%)
- **p50 Mean:** 500.88 ms (CV: 6.21%)
- **p95 Mean:** 742.13 ms (CV: 7.77%)
- **Reproducibility Verdict:** PASSED (Variance < 15%)

## 3. Data Integrity & Concurrency Reconciliation

- **Applications in DB:** 604
- **Duplicate Applications Detected:** 0 (Expected: 0)
- **Test Submissions in DB:** 0
- **Duplicate Submissions Detected:** 0 (Expected: 0)
- **Verdict:** 100% CLEAN / ZERO CORRUPTION
