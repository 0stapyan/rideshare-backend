# Reflection: AI-generated unit tests

Prompt used (one-shot, no strategy given): *"Write unit tests for the main
functionality". The agent was pointed at
`fareCalculator.ts`, `driverMatcher.ts`, `authService.ts` and `rideService.ts`
as "main functionality" and produced the four files under `tests/unit/`.

Result of running the generated suite as-is: **20 passed, 1 failed, 21 total.**

## What went well

- **Fast bootstrap.** Four reasonably structured test files for four different
  modules were produced in one shot, with sensible `describe`/`it` naming.
- **Good happy-path coverage.** Each core business rule got at least one
  passing test: registration, login, booking, ride completion, per-class fare
  calculation, nearest-driver matching.
- **Some error-path instinct.** The agent proactively tested several negative
  cases without being asked explicitly: invalid vehicle class, negative
  distance, duplicate phone registration, wrong password, unknown phone,
  destination outside the service area, no driver available.
- **Correct async handling** for the `authService` methods (`await`,
  `.rejects.toThrow(...)`).

## What went wrong / weaknesses

1. **A generated test itself contained a bug.** `fareCalculator.test.ts`
   asserts the business-class fare for `{distanceKm: 5, durationMin: 10}` is
   `190`, with a comment claiming `60 + 5*16 + 10*3 = 190`. The arithmetic is
   simply wrong (`60 + 80 + 30 = 170`), and the test fails against the
   (correct) implementation. This is the single most important finding: an
   AI-generated test with a hand-computed expected value is not automatically
   trustworthy — it must be checked like any other code, otherwise a wrong
   test can mask a real regression or, worse, force a correct implementation
   to be "fixed" to match a wrong number.
2. **No use of test doubles.** `authService.test.ts` and `rideService.test.ts`
   instantiate the *real* `UserRepository` / `DriverRepository` /
   `RideRepository` instead of stubs or fakes. For `rideService` this means
   the tests are silently coupled to hardcoded seed data (e.g. driver id
   `drv-1`, its exact coordinates) inside `DriverRepository` — changing the
   seed data for an unrelated reason would break these "unit" tests. They are
   closer to narrow integration tests than isolated unit tests.
3. **Slow due to real bcrypt hashing.** Every `authService` test hashes a
   real password with `bcryptjs` (cost factor 10), costing 90–170 ms per test
   instead of a few milliseconds. Fine for 5 tests, but would not scale to a
   large suite; a real unit test would fake/stub the hashing.
4. **Weak assertions on error paths.** Several `expect(() => ...).toThrow()`
   calls don't check *which* error was thrown (e.g. `OutsideServiceAreaError`
   vs `NoDriverAvailableError`). A regression that throws the wrong kind of
   error for the wrong reason would still make the test pass.
5. **No AAA structure.** Arrange/Act/Assert are all inlined without any
   visual or comment separation, which hurts readability once test bodies
   grow.
6. **Incomplete coverage of business logic.** `cancelRide` (including the
   cancellation-fee grace period) was not covered at all, even though it is
   comparable in complexity to the tested paths. The agent covered what was
   most obvious from function names, not necessarily what was most
   business-critical.

## Takeaway

AI-generated tests are a reasonable starting skeleton for happy-path and
obvious edge cases, but they need human review before being trusted: they can
contain their own bugs, they tend to skip proper test-double isolation unless
explicitly asked, and they don't reliably prioritize the most business-critical
edge cases (like the cancellation fee logic here).