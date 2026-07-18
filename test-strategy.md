# Unit test strategy — rideshare-backend

This strategy is the result of what we learned in steps 2.1 (naive AI
generation) and 2.2 (manual fixtures): it exists so that asking an agent to
"generate the remaining unit test coverage" produces something trustworthy
without a human rewriting it afterwards.

## Scope for this pass
Everything under `src/` that is NOT already covered by
`tests/unit/{fareCalculator,driverMatcher,rideService,authService}.test.ts`:
- `src/services/serviceArea.ts`
- `src/utils/jwt.ts`
- `src/services/rideService.ts` → `completeRide` (bookRide/cancelRide are done)
- `src/repositories/*.ts` (currently only exercised indirectly through mocks)

## Structure & style rules
1. **One test file per source file**, mirroring the `src/` path under `tests/unit/`.
2. **Group tests into fixtures with `describe`**, one fixture per scenario/behaviour,
   not one flat list per module.
3. **Every test follows AAA** with `// Arrange` / `// Act` / `// Assert` comments.
4. **Never hardcode a derived numeric expectation** — compute the expected value
   from the same constants/helpers the implementation uses (see the
   `fareCalculator` fixture from step 2.2 for the pattern), or from plain
   arithmetic that's independently obviously correct. Do not copy a magic
   number from a comment without recomputing it.
5. **Assert the specific error type/class** (`expect(fn).toThrow(SomeError)`),
   never a bare `.toThrow()` with no argument.

## Isolation rules (test doubles)
6. Any test that depends on **another module we already unit-test elsewhere**
   must isolate it with a test double (jest mock/stub) — do not let a test for
   module A silently depend on the real implementation of module B.
7. Repositories are simple enough to test directly with **no test doubles** —
   test the real `UserRepository` / `DriverRepository` / `RideRepository`
   instances, since they ARE the thing under test here (this is the one
   exception to rule 6: you can't isolate the unit under test from itself).
8. External/impure primitives (hashing, crypto, real wall-clock time) get
   mocked wherever they're not themselves the thing being tested — see
   `authService.test.ts` mocking `bcryptjs` as the reference example.

9. **Never rely on real elapsed wall-clock time.** No `setTimeout`/sleep-based
   waiting to observe time-dependent behaviour (token expiry, cancellation
   grace periods, etc.). Either fabricate the relevant timestamp directly
   (e.g. sign a token with an already-past `exp` claim, or pass an explicit
   `now: Date` into service methods that accept one) or use Jest fake timers
   (`jest.useFakeTimers()` + `jest.advanceTimersByTime()` /
   `jest.setSystemTime()`) to advance the clock instantly. A unit test that
   takes over ~50ms is a signal something is real that should be fake.

## What "done" looks like
Running `npm test` produces **zero failing tests** and **zero flaky/slow
tests** — every individual test completes in single-digit milliseconds, and
the full suite completes in low single-digit seconds.

## Revision history
- **v1 → v2**: added rule 9 after the first generation pass produced a
  passing-but-slow test (`jwt.test.ts`, "throws for an expired token") that
  waited 1.1 real seconds via `setTimeout` instead of faking the clock. The
  test wasn't wrong, but it violated the spirit of a fast, deterministic unit
  suite — v1 didn't make that requirement explicit enough for the agent to
  catch it on its own.