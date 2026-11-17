# Trophy Rooms for the web

The web app for [Trophy Rooms](https://trophyrooms.org). Track your games, physical collection, play sessions, and achievements.

Built with Next.js, TypeScript, and Apollo Client. Supabase handles sign-in; the shared GraphQL API stores the data.

## Run it

You need Node.js 20+, a running backend, and the same Supabase project as the backend.

```bash
git clone https://github.com/G3mha/trophy-rooms-web.git
cd trophy-rooms-web
npm ci
cp .env.example .env.local
```

Set the API URL, Supabase URL, and publishable key in `.env.local`. For local OAuth, allow `http://localhost:3000/sso-callback` in Supabase.

```bash
npm run dev
```

Open `http://localhost:3000`. Run `npm run lint` and `npm run build` to check code changes. Use `npm run codegen` to regenerate GraphQL types against the local development API.

## Related

- [Backend](https://github.com/G3mha/trophy-rooms-backend)
- [iOS app](https://github.com/G3mha/trophy-rooms-ios)
