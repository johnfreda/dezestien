# DeZestien.nl

Nederlands voetbalnieuws, transfers & analyse.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **CMS**: Sanity v3 (Portable Text)
- **Database**: Prisma + PostgreSQL (users, comments, forum)
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS v4
- **Deploy**: Vercel
- **Analytics**: Vercel Analytics

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token

DATABASE_URL=your_postgres_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

## Categorieën

- Eredivisie
- Champions League
- Europa League
- Conference League
- Transfers
- Oranje
- Buitenland
- Eerste Divisie
- Vrouwenvoetbal
- Analyse
- Opinie

## License

Private — All rights reserved.
