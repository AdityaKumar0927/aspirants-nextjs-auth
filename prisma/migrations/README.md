# Prisma migrations — baseline & cutover

The build script currently runs `prisma db push` (see package.json), which syncs
the schema to the database **without a migration history**. That makes any
non-additive change (enum rename, column type/required change, index on a huge
table) an unguarded production migration.

`0_init/migration.sql` is a **baseline** generated from the current schema
(`prisma migrate diff --from-empty`). It was produced offline and applied to no
database. It exists so the repo can switch to versioned migrations.

## One-time cutover (run deliberately, with a DB backup)

The production database already has these tables (created by `db push`), so the
baseline must be marked as **already applied** rather than re-run:

```bash
# 1. Mark the baseline as applied on the live DB (does NOT run the SQL)
npx prisma migrate resolve --applied 0_init

# 2. From now on, create changes as migrations instead of db push
npx prisma migrate dev --name <change>     # locally, against a dev DB
npx prisma migrate deploy                  # in CI/production
```

## Then update the build

Change `package.json` `build` from:

```
prisma generate && prisma db push && next build
```

to:

```
prisma generate && prisma migrate deploy && next build
```

Until the cutover is performed, leave the build on `db push` — switching first
would fail because the live DB has no `_prisma_migrations` table yet. For large
tables, prefer `CREATE INDEX CONCURRENTLY` (hand-edit the migration) during a
maintenance window.
