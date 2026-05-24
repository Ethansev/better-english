# 10 — Clean up pre-existing ESLint warnings

## Goal
Remove two unused-variable warnings that existed before the Railway migration. Trivial cleanup; not blocking anything.

## Warnings

```
src/components/TextImprover.tsx
  41:17  warning  'setTone' is assigned a value but never used

src/lib/streaming.ts
  187:19  warning  'textContent' is assigned a value but never used
```

## Steps

### `src/components/TextImprover.tsx:41`
Inspect line 41 — likely a `useState` destructure that captures both the value and setter when only one is used. Either:
- Remove the setter from the destructure: `const [tone] = useState(...)` instead of `const [tone, setTone] = useState(...)`
- Or actually wire up `setTone` to whatever was supposed to call it (probably intended to be passed to a child component)

### `src/lib/streaming.ts:187`
Inspect line 187 — looks like an accumulator variable that's written to but never read. Either:
- Delete the line if accumulation was unintentional
- Or use the value somewhere if it was meant for logging/debugging

## Verification
- `npm run lint` shows 0 warnings
- `npm run build` still passes
- Smoke test: improve some text via the app — both files are in the main flow
