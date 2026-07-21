# Triple Entente — Website + ERP

A premium coaching-institute platform for **Triple Entente** (*"Study Hard, Result Best"*):
a public marketing website plus a role-based ERP for Admin, Teacher, Student and Parent.

Built with **Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma + SQLite, and Auth.js (NextAuth)**.

---

## Features

### Public website
- Home, About, Courses (Foundation 8–10 · Class 11–12), Faculty, Results, Gallery, Contact
- Premium navy + gold academic design, fully responsive
- Working **admission enquiry form** → saved to the database and shown in Admin → Admissions

### ERP (login-protected)
| Role | Can do |
|------|--------|
| **Admin** | Manage students, staff, batches, fees, attendance, exams; view enquiries; post notices; full dashboards |
| **Teacher** | Mark attendance & enter exam marks for assigned batches; post notices |
| **Student** | View attendance %, fees due + receipts, results/report card, notices |
| **Parent** | View their child's attendance, fees and results (read-only) |

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up the database (creates SQLite db + tables)
npm run db:migrate        # or: npx prisma migrate dev --name init

# 3. Seed demo data (accounts, batches, students, fees, marks…)
npm run db:seed

# 4. Run the dev server
npm run dev
```

Open **http://localhost:3000** for the website and **/login** for the ERP.

### Demo logins (password: `password123`)
| Role | Email |
|------|-------|
| Admin | `admin@tripleentente.in` |
| Teacher | `teacher@tripleentente.in` |
| Student | `student@tripleentente.in` |
| Parent | `parent@tripleentente.in` |

---

## Useful scripts
- `npm run dev` — start dev server
- `npm run build` / `npm start` — production build & serve
- `npm run db:seed` — re-seed demo data
- `npm run db:reset` — wipe & re-migrate the database
- `npm run db:studio` — open Prisma Studio (visual DB browser)

---

## Rebranding
All institute details (name, tagline, phone, email, address, courses, stats) live in
**`src/lib/site.ts`** — edit that one file to rebrand the whole site.
The text logo is in `src/components/Logo.tsx`. Colors/fonts are in `src/app/globals.css`.

> The city in the address is currently a placeholder `[City]` in `src/lib/site.ts` — update it.

---

## Going to production
- **Database:** switch SQLite → PostgreSQL by changing `datasource db` in `prisma/schema.prisma`
  (`provider = "postgresql"`) and setting `DATABASE_URL` to your Postgres connection string.
- **Auth secret:** set a strong `AUTH_SECRET` (run `npx auth secret`).
- **Online payments:** the `Payment` model is Razorpay-ready — a gateway can be added
  without schema changes (fees are currently tracked manually).

---

## Project structure
```
src/
  app/
    (marketing)/        # public website (home, about, courses, …, contact)
    (erp)/dashboard/    # role-based ERP (students, fees, attendance, exams, …)
    login/              # auth
    api/auth/           # NextAuth route
  components/           # ui/, erp/, Navbar, Footer, Logo, PageHeader
  lib/                  # prisma, auth, rbac, dal, validators, site config
prisma/
  schema.prisma        # data model
  seed.ts              # demo data
```
