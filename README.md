[![make.fun · gta6-meme-x-01](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![rank](https://make.fun/badge/gta6-meme-x-01/dungser097/gta6-meme-x-01/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)
[![reward](https://make.fun/badge/gta6-meme-x-01/dungser097/gta6-meme-x-01/reward.svg)](https://make.fun/bounty/gta6-meme-x-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-meme-x-01)

# GTA 6 Meme — make.fun bounty gta6-meme-x-01

Entry for the make.fun bounty "Post a GTA 6 meme on X" ($500, top 50 share it).
Bounty: https://make.fun/bounty/gta6-meme-x-01
Referral: https://make.fun/r/j86ntykd
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

Writes `meme.png` (1200x675) next to this file and copies `POST.json`
to the output dir (`MAKEFUN_OUTPUT_DIR`, default `/output`).
Deterministic: same bytes on every run.

## Files

- `main.ts` — the meme generator (canvas, PNG codec, 5x7 font, scene)
- `mark-1024.png` — make.fun ghost mark, official press kit, used as-is
- `meme.png` — the generated meme (first picture of the X post)
- `POST.json` — names the X post URL
- `.makefun/owner.json` — the make.fun payout wallet for this entry

## X post

Posted from the public X account @nendah097, first picture = `meme.png`:

https://x.com/nendah097/status/2123495777330958559

> GTA 6's easiest mission in Leonida: no heist required 👻 Earn $500 on make.fun @makefunai makefun-stadium-syrup-tundra

## Status

- [x] Meme built (`meme.png`)
- [x] Posted on X
- [ ] Submitted to make.fun (repo + POST.json + transcripts)
