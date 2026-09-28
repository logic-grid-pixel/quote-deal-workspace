<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- List pages that own detail children must be `*.index.tsx` leaves (e.g. `quotes.index.tsx` + `quotes.$quoteId.tsx`), never a leaf `quotes.tsx` — a leaf parent swallows child routes and they 404.
- tsconfig uses `exactOptionalPropertyTypes`: optional fields are declared `field?: T | undefined`, and possibly-empty indexed access (array `[0]`, `split()[0]`) needs `!` or a `??` fallback.
- All state is client-side in the zustand store (`src/lib/store.ts`); the app is a demo prototype with seeded data, no backend.
