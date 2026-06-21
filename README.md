# ApexJudge

ApexJudge is an online judge for creating programming problems, running code, and tracking submissions.

## Running locally

Start each service from its own directory:

```bash
cd backend
npm install
npm run dev
```

```bash
cd compiler
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_URL` from `frontend/.env`. For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

## How to upload a well-formatted problem

Sign in, open **Problems**, and select **Create problem**. The editor has four steps.

### 1. Details

- **Title:** Use a short, descriptive name.
- **Difficulty:** Easy, Medium, or Hard.
- **Tags:** Add comma-separated topics such as `graphs, dijkstra, shortest path`.
- **Time limit:** Enter milliseconds. `2000` means two seconds.
- **Memory limit:** Enter megabytes.
- **Expected complexity:** Optional author guidance, for example `O(N log N)` time and `O(N)` space.

### 2. Statement

Keep each kind of information in its own field. Do not paste the entire question into one field.

- **Problem story:** Optional motivation or narrative.
- **Formal problem statement:** Precisely define what the contestant must compute.
- **Input format:** Explain every line and value in input order.
- **Output format:** Explain exactly what must be printed.
- **Constraints:** Put one constraint on each line.
- **Notes or hints:** Add clarifications that do not reveal the solution.

Formatting supported inside text fields:

- Separate paragraphs with a blank line.
- Start bullet points with `- `.
- Start numbered items with `1. `, `2. `, and so on.
- Wrap variable names or expressions in backticks, such as `` `N` `` or `` `A[i]` ``.
- Wrap important phrases in double asterisks, such as `**exactly once**`.

Example formal statement:

```text
You are given an array `A` containing `N` positive integers.

A subarray is called resonant when:
- its sum starts with digit `X`;
- its sum ends with digit `X`.

Count the number of resonant subarrays.
```

Example input format:

```text
The first line contains two integers `N` and `X`.
The second line contains `N` integers `A1, A2, ..., AN`.
```

Example constraints:

```text
1 ≤ N ≤ 2 × 10^5
0 ≤ X ≤ 9
1 ≤ Ai ≤ 10^9
```

### 3. Examples and judge tests

These are intentionally separate:

- **Public examples** appear in the problem statement. Add representative inputs, outputs, and explanations.
- **Judge test cases** are used to evaluate code. Add normal cases, edge cases, minimum values, maximum values, and cases designed to catch common mistakes.

Do not use every judge case as a public example. Usually two or three public examples are enough.

### 4. Review and publish

Review the required sections and verify that:

- the statement is unambiguous;
- input and output formats match the test data;
- every public example has the correct output;
- judge cases cover edge conditions;
- limits are realistic for the expected solution.

Select **Publish problem** when the review is complete.

## Editing or deleting a problem

Only the original author sees the edit and delete controls in the Problems table.

- **Edit:** Opens the same structured editor with the existing data.
- **Delete:** Requires confirmation and removes the problem and its associated submissions.

The backend also checks ownership. Hiding buttons in the frontend is not the security boundary; unauthorized update and delete requests return `403`.

## Deployment note

Frontend changes and backend routes must both be deployed. The deployed API health response should include:

```json
{
  "status": "ok",
  "features": {
    "structuredProblems": true,
    "problemEdit": true,
    "problemDelete": true
  }
}
```

If create, edit, or delete works locally but returns `404` in production, redeploy the Railway backend from the latest `main` commit.
