# Coverage metrics — rideshare-backend

Generated with `npm run test:coverage` (Jest + Istanbul), running all 65
tests (unit + integration) together.

## Summary

| Metric | Covered / Total | % |
|---|---|---|
| Statements | 218 / 277 | 78.70% |
| Branches | 65 / 93 | 69.89% |
| Functions | 44 / 50 | 88.00% |
| Lines | 211 / 269 | 78.43% |

## What each metric actually measures

- **Statement coverage** — % of individual executable statements (an
  assignment, a function call, a `return`, ...) that ran at least once.
- **Line coverage** — % of *source lines* that ran at least once. Very close
  to statement coverage in practice, but not identical: a single line can
  hold multiple statements (`if (x) return a(); else return b();` — one
  line, two statements), and formatting can split one statement across
  several lines. This is the direct, practical answer to control question
  #5 ("100% line coverage — what's the statement percentage?"): it is **not
  necessarily 100%** — a fully-covered line can still contain an uncovered
  statement/expression if that line packs more than one statement, or a
  partially-covered ternary/logical expression that line-coverage tools
  don't break down further.
- **Branch coverage** — % of the possible branches at each decision point
  (`if`/`else`, `? :`, `&&`/`||` short-circuits, `switch` cases, default
  parameters) that were actually exercised. This is a *stricter* metric than
  statement/line coverage: a statement can be "covered" by running only the
  `true` path of an `if`, while the `false` path (a distinct branch) was
  never taken.
- **Function coverage** — % of declared functions/methods that were called
  at least once, regardless of what happened inside them.
- **"Class" coverage** — Istanbul/Jest (the JS/TS coverage tooling used
  here) has no distinct "class" metric the way JaCoCo does for Java; a class
  in JS is just a container of functions, so it's implicitly covered by
  function coverage of its methods. For this report we tracked it manually:
  every exported class in `src/` (`AuthService`, `RideService`,
  `UserRepository`, `DriverRepository`, `RideRepository`) is instantiated
  and exercised by at least one test, so **manual class coverage = 5/5 =
  100%**.

## Per-module breakdown (highlights)

| Module | Statements | Branches | Notes |
|---|---|---|---|
| `services/*` | 97.0% | 92.3% | Core business logic — thoroughly covered by unit tests (steps 2.2–2.3) |
| `repositories/*` | 100% | 92.9% | Fully covered; one branch in `UserRepository` (line 13) is an edge case not yet exercised |
| `middleware/authMiddleware.ts` | 88.9% | 80% | Covered by the narrow integration tests (step 3); lines 23–24 (the `TokenExpiredError`-specific branch) partially miss one sub-case |
| `routes/authRoutes.ts`, `routes/rideRoutes.ts` | 41.4% / 21.7% | 25% / 0% | **Lowest coverage in the project.** Unit tests bypass the HTTP layer entirely (they call services directly), and only one integration test so far goes through real routes. This is expected to improve once the contract tests for the two main business processes (step 5) exercise `POST /rides` and `POST /rides/:id/complete` end-to-end over HTTP. |

## Why statement/line coverage (78%) is higher than branch coverage (70%)

This gap is normal and expected: our unit tests reliably call each function
with at least one representative input (driving statement/line coverage up
quickly), but many functions have multiple conditional branches
(`OutsideServiceAreaError` vs `NoDriverAvailableError` vs happy path in
`bookRide`, for example) and not every combination has a dedicated test yet
— particularly inside the still-thin `routes/` layer. Branch coverage is a
stricter, more meaningful signal of how thoroughly the *decision logic* was
exercised, not just whether the code ran.

## Relevant to control question #3

100% statement and branch coverage would still **not** guarantee the
absence of bugs. Coverage only proves every line/branch *executed*; it says
nothing about whether the *assertions* checked the right thing, whether the
*expected values themselves* were correct (see step 2.1 — the AI-generated
test that asserted the wrong fare), or whether some *unwritten* requirement
was missed entirely (see step 2.2 — the `distanceKm` symmetry bug, which no
amount of coverage on the buggy version would have caught, since the buggy
code was fully "covered" by the original AI-generated tests — it just wasn't
checked for the *right property*).