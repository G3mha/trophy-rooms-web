# Trophy Rooms for the web

The web client for [Trophy Rooms](https://trophyrooms.org): organize the games you play, catalog the copies you own, keep a play journal, and record achievements.

Built by Enricco Gemha with Next.js 15, React 19, TypeScript, and Tailwind CSS 4. Apollo Client talks to the shared [GraphQL API](https://github.com/G3mha/trophy-rooms-backend); Supabase handles authentication. The [native iOS app](https://github.com/G3mha/trophy-rooms-ios) uses the same backend.

## Features

- Browse games, platform releases, editions, and bundles.
- Manage your backlog and current, paused, completed, or dropped games.
- Catalog physical copies with region, condition, and packaging details.
- Maintain buy and sell lists.
- Log play sessions and review your journal.
- Record achievement progress manually and display earned trophies.
- View community activity, leaderboards, and public profiles.
- Administer catalog data through role-controlled screens.

Trophy Rooms covers multiple gaming platforms. Achievement lists are available for a subset of the catalog; progress does not automatically synchronize from consoles or PC stores.

## Run locally

You need Node.js 20 or later, npm, a running [Trophy Rooms backend](https://github.com/G3mha/trophy-rooms-backend#local-setup), and a Supabase development project shared with that backend.

```bash
git clone https://github.com/G3mha/trophy-rooms-web.git
cd trophy-rooms-web
npm ci
cp .env.example .env.local
```

Set the three client variables in `.env.local`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GRAPHQL_URL` | Your backend URL; local default `http://localhost:4000/graphql` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase development project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That project's public/publishable key |

Enable the sign-in providers you intend to use in Supabase Auth. For local OAuth, allow `http://localhost:3000/sso-callback` as a redirect URL. Use the matching HTTPS callback for a deployed frontend. The callback exchanges the authorization code for a cookie-backed session.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Start the API separately on port 4000 and keep both clients and backend pointed at the same Supabase project.

All `NEXT_PUBLIC_*` values are included in the browser bundle. Never put a Supabase service-role key, database password, or other server credential in them. Prisma and database migrations live in the backend repository.

## Architecture and layout

Supabase manages the browser's session. Authenticated GraphQL requests carry the user's access token to the API, which verifies identity and applies authorization. Apollo manages client-side GraphQL data; the API owns database access and catalog rules.

| Path | Purpose |
|---|---|
| `src/app/` | App Router pages, layouts, and the OAuth callback |
| `src/components/` | Shared UI and authentication components |
| `src/lib/auth.tsx` | Authentication state and sign-in flows |
| `src/lib/supabase/` | Supabase browser client |
| `src/lib/apollo-wrapper.tsx` | Authenticated Apollo provider |
| `src/lib/apollo-client.ts` | Shared Apollo configuration |
| `src/graphql/` | GraphQL operations |
| `src/generated/` | Generated GraphQL types and hooks |
| `codegen.ts` | GraphQL Code Generator configuration |
| `public/` | Static assets |

## Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run the configured Next.js lint command |
| `npm run build` | Build the production application |
| `npm start` | Serve an existing production build |
| `npm run codegen` | Generate types and React Apollo hooks from the API schema |
| `npm run codegen:watch` | Regenerate on operation changes |

GraphQL Code Generator reads `NEXT_PUBLIC_GRAPHQL_URL` from its process environment, falling back to the local API. Run it against a development API with introspection enabled:

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql npm run codegen
```

Do not point code generation at the production API, where introspection is disabled. Generated artifacts live in `src/generated/graphql.ts`.

Run lint and a production build before committing code changes. There is currently no `npm test` script or configured Jest dependency. See [CLAUDE.md](CLAUDE.md) for repository conventions, including visual identity and icon rules.

## Deployment

The public application runs at [trophyrooms.org](https://trophyrooms.org). For a Vercel deployment, set the three public environment variables with the deployed API and Supabase project, configure Supabase's site and callback URLs, and ensure the API accepts the frontend origin. Changes to public environment variables require a new frontend build.

## Related repositories

- [trophy-rooms-backend](https://github.com/G3mha/trophy-rooms-backend) — GraphQL API, Prisma schema, and catalog tools.
- [trophy-rooms-ios](https://github.com/G3mha/trophy-rooms-ios) — SwiftUI client.

## Author

Created and maintained by Enricco Gemha.
