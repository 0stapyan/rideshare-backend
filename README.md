# Rideshare backend (demo project for QA Lab 2)

Minimal server-side ride-booking API used as the subject of QA Lab 2
(structural / white-box testing, unit & integration tests). Continues the
domain used in Lab 1 (rideshare / "Bolt clone" app).

## Stack
- Node.js + TypeScript
- Express (HTTP API)
- In-memory repositories (no external DB, keeps the project self-contained)
- JWT-based authentication (`jsonwebtoken`, `bcryptjs`)
- Jest + Supertest for testing

## Domain / main functionality
- **Auth**: register (`POST /auth/register`) and login (`POST /auth/login`) with a phone number and password; login returns a signed JWT.
- **Booking a ride** (`POST /rides`, protected): validates the destination is inside the service area, finds the nearest available driver of the requested vehicle class, calculates an estimated fare, creates the ride.
- **Cancelling a ride** (`POST /rides/:id/cancel`, protected): cancels a ride, applying a cancellation fee if cancelled after a grace period.
- **Completing a ride** (`POST /rides/:id/complete`, protected): calculates the final fare and produces a receipt.

## Security component
`src/middleware/authMiddleware.ts` (`requireAuth`) guards every ride-related
route. This is the target of the narrow integration tests in step 3 of the
lab (missing / malformed / invalid / expired tokens).

## Two main business processes (used for the contract tests in step 5)
1. **Book a ride** — `POST /rides`
2. **Complete a ride & charge payment** — `POST /rides/:id/complete`

## Scripts
```
npm run dev              # run the server locally
npm test                 # run all tests
npm run test:unit        # unit tests only
npm run test:integration # integration tests only
npm run test:contract    # contract tests only
npm run test:coverage    # run tests with coverage report
```
