# SKYLORA — English A–Z Adventure

A calm, illustrated browser alphabet game for ages 4–8. The root `/` is a game catalog. English lives at `/english-az-adventure`; Number Hunt remains at `/number-hunt`.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. To verify a production build:

```bash
npm run build
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

The Playwright suite includes learning-engine tests, all ten levels, adaptive confusion practice, persistence, audio cancellation/fallbacks, keyboard and dialog focus, reduced motion, 320–1366px layouts, and the original Number Hunt regression suite.

## Learning experience

Start with the A–Z letter book: each letter offers five labeled word cards (130 total), browser-voice pronunciation, replay, and uppercase/lowercase forms. Explore all five words to complete a letter. After all 26 letters are explored, the existing ten practice levels open. Letter-book progress uses a separate validated, versioned local save; exploring words is not an assessment of mastery. Sound-off or unavailable-speech users can read together and still progress. X examples use the final /ks/ sound (box, fox, six, wax, mix).

The letter book bundles Twemoji SVG picture cues locally so rendering does not depend on emoji fonts or remote requests. Attribution and the CC BY 4.0 license are included under `public/images/words`; some cues represent an associated concept rather than an exact illustration. Existing practice activities retain their 26 SVG illustrations. Browser speech is not studio-recorded pronunciation audio.

Each session has ten discoveries, followed by a natural stopping point. A child chooses when to continue. There are no timers, lives, negative scores, streak penalties, ads, purchases, external links, or leaderboards.

1. A–C, three cards
2. A–F, three cards
3. A–J, four cards
4. A–Z, four cards
5. Uppercase to lowercase
6. Listening, with an optional visual clue
7. Sound identification in spoken words
8. Letter-to-picture associations
9. b/d, p/q, m/n, u/v discrimination
10. Alphabet Detective: all activity types, six cards

Pip is an original SVG guide. All 26 word illustrations are original inline vectors. Tailwind uses the existing SKYLORA lavender design tokens, supplemented with calm meadow colors. Shared GameShell, ProgressDots and PauseMenu are reused; the shared Dialog handles focus trapping, Escape and focus restoration.

## Architecture

- `lib/english/content.ts`: letter mappings, example vocabulary, levels, badges and confusion families.
- `lib/english/questions.ts`: reproducible seeded questions, constrained distractors and bounded adaptive review. C and K are never competing correct answers in a phonics round.
- `lib/english/engine.ts`: explicit reducer states and guarded transitions. A completed answer advances the durable session before the reward screen, preventing duplicate rewards on rapid taps or refresh.
- `lib/english/storage.ts`: versioned, validated local persistence. Unknown versions and malformed fields recover to safe defaults. No account or server is required.
- `lib/english/audio.ts`: cancellable English speech with voice selection and failure reporting; reuses existing audio availability/cancellation helpers.
- `lib/english/analytics.ts`: local `skylora:game` CustomEvents for a future integration. No analytics are transmitted. Payloads contain learning activity information, not child identifiers.
- `components/english`: reusable artwork, cards, audio/hint controls, home map, parent observations and adventure orchestration.

Saved progress includes tutorial completion, sound preference, unlocked/completed levels, an exact resumable question, letters practised, unassisted first attempts, hints, replays, confusion categories and last played date. Restarting a trail keeps earned stars and cumulative learning observations. Changing to another level asks before replacing an unfinished trail. Storage failures leave the game playable with a visible save notice.

Confusions are used only for additional practice. Scores never diagnose learning difficulties. Parent observations are intentionally outside the child gameplay UI. `firstTry` measures first selection without a hint, not merely eventual success.

## Audio/content release considerations

The implementation is fully playable with browser speech synthesis and visual fallbacks. It does **not** ship studio-recorded letter/phoneme clips or claim accent-independent pronunciation. Available voices vary by browser/device; English (GB) is preferred, with another English voice as fallback. The Replay control cancels the prior utterance before speaking. Sound preference persists; leaving, pausing or muting cancels speech.

Phonics rounds ask about sounds in a spoken example word, rather than sending IPA symbols to text-to-speech as if they were reliable isolated phonemes. Q is taught with U in “queen”; X uses the final sound of “box”; C/G use their hard sounds. Printed phoneme symbols use a British English reference. Before a classroom/public content release, an early-literacy specialist should review the selected voice/content on target devices and supply professionally reviewed recordings if consistent isolated phonemes are required. Real iPhone/iPad/Android audio and child usability pilot testing remain release work beyond automated Chromium testing.

No microphone is used. No child name, birthday, location, recordings, or account information is collected. Browser storage is device-local and may be cleared by the browser; a future sync adapter should be added behind the storage boundary rather than inside UI components.

## Game 02 — Sound Match

Sound Match runs at `/sound-match` and appears beside Game 01 and Number Hunt on the Games Home page. Six ten discovery sessions teach sound-to-letter, sound-to-picture, picture-to-letter, beginning-sound, similar-sound, and mixed detective activities. Choices begin at two or three large cards and adjust from recent practice. The last level uses six modes, with gentle visual progress and a short stopping point.

- `lib/sound-match/content.ts`: reviewed grapheme/word examples, controlled mappings, six level designs and adaptive-unlock switch.
- `lib/sound-match/questions.ts` and `difficulty.ts`: seeded choice generation, sound-distinct distractors, progressive A–Z introduction and adaptive review.
- `lib/sound-match/progress.ts` and `storage.ts`: guarded game state and versioned, corruption-tolerant persistence behind a replaceable `ProgressStore` boundary.
- `lib/sound-match/audio.ts`: cancellable speech, optional real-recording manifest, failed-audio fallback, a watchdog for stalled speech and subtle synthesized chimes.
- `lib/sound-match/analytics.ts`: local events only; no child identifiers or analytics network requests.
- `components/sound-match`: welcome map, tutorial, sound rounds, pause, adult observations and illustrated Sound Garden.

The six levels can be tried independently by default. `REQUIRE_ALPHABET_BOOK` in `lib/sound-match/content.ts` can turn on the alphabet-book gate. Progress includes per-activity observations, recent first-try results, confused pairs, settings, ten-round checkpoints, completion dates and resumable rounds. Voice and chimes have separate saved preferences. No timer, leaderboard, purchases, chat, microphone, account or screen-time streak is included.

The built-in fallback speaks example words and instructions with the device English voice; it does not manufacture an isolated IPA phoneme or claim studio narration. Reviewed phoneme/word audio files can be added by key to `AUDIO_CLIPS`; playback falls back to speech when missing or unavailable. Q is taught as `qu` in queen; C is hard /k/ in cat; G is hard /g/ in goat; X marks the final /k/ /s/ sounds in box. The UF Literacy Institute notes that example pronunciation should be modeled for blending and groups X later in its scope and sequence. Content uses a controlled early vocabulary; voice/accent checking on target devices and a literacy-review pass are still required before classroom release.

Twemoji SVG picture cues from the letter book are local assets, carry their upstream attribution and CC BY 4.0 notice, and are available to this game offline. All game scenery and cards use bundled inline SVG.
