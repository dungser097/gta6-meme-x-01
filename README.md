# GTA 6 Meme — make.fun bounty gta6-meme-x-01

Entry for the make.fun bounty "Post a GTA 6 meme on X" ($500, top 50 share it).
Deadline: 23 Nov 2026 21:00 WIB.

## The joke

A GTA-style title card: the make.fun ghost arrives in Leonida as the
protagonist, and the first mission briefing pays $500 on make.fun —
no heist required. The ghost mark is the official press-kit asset,
used as-is; everything else is drawn by `main.ts`.

## Run

```sh
node main.ts   # Node 22+, standard library only, no network
```

Writes `meme.png` (1200x675) next to this file. Deterministic: same
bytes on every run.

## Files

- `main.ts` — the meme generator (canvas, PNG codec, 5x7 font, scene)
- `mark-1024.png` — make.fun ghost mark, official press kit, used as-is
- `meme.png` — the generated meme (first picture of the X post)
- `POST.json` — added after the X post goes live (names the post URL)

## X post (caption draft)

> GTA 6's easiest mission in Leonida: no heist required 👻 Earn $500 on make.fun https://make.fun/r/j86ntykd @makefunai

Post from the public X account @nendah097, first picture = `meme.png`.

## Status

- [x] Meme built (`meme.png`)
- [ ] Posted on X
- [ ] Submitted to make.fun (repo + POST.json + transcripts)
