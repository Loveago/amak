# AmaBaKinaata Enterprise Backend

Express + Prisma API for the AmaBaKinaata Enterprise platform.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Ensure PostgreSQL is running and `DATABASE_URL` points to your instance.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize Prisma:
   ```bash
   npx prisma generate
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed data (admin, categories, plans):
   ```bash
   npm run prisma:seed
   ```

## Development

```bash
npm run dev
```

## API Base

`/api/v1`

## Notes

- Admin account is seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Paystack secrets are required for payment verification and webhook security.
