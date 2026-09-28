"use client";
import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { GAMES, SKILLS, WORLDS, type World } from "../../lib/world/catalogue";
import { fresh, type Progress } from "../../lib/world/types";
import { worldStore } from "../../lib/world/storage";
import { recommendation, stage } from "../../lib/world/progress";
import { WorldFrame, WorldNav, Guide } from "./WorldFrame";
import { GameLibrary } from "../game/GameLibrary";
import { Dialog } from "../game/Dialog";
export function WorldHub({
  world,
  view = "home",
}: {
  world?: World;
  view?: "home" | "progress" | "settings" | "rewards";
}) {
  const [p, set] = useReducer((_: Progress, n: Progress) => n, fresh()),
    [available, setAvailable] = useReducer((_: boolean, n: boolean) => n, true),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const update = () => {
      const result = worldStore.load();
      set(result.progress);
      setAvailable(result.available);
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("skylora-progress", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("skylora-progress", update);
    };
  }, []);
  const save = (next: Progress) => {
    set(next);
    setAvailable(worldStore.save(next));
  };
  const recommended = recommendation(p, world),
    resume = p.session && GAMES.find((g) => g.slug === p.session!.game),
    w = WORLDS.find((x) => x.id === world),
    total = Object.values(p.games).reduce((n, g) => n + g.discoveries, 0);
  function download() {
    const data = {
      ...p,
      settings: { ...p.settings, name: "" },
      session: p.session ? { ...p.session, name: "" } : null,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "skylora-learning-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <WorldFrame
      settings={p.settings}
      toggleVoice={() =>
        save({ ...p, settings: { ...p.settings, voice: !p.settings.voice } })
      }
    >
      <WorldNav />
      {view === "home" && (
        <>
          <section className="world-hero">
            <div>
              <p className="world-eyebrow">Small steps. New possibilities.</p>
              <h1>{w ? w.title : "A world of little discoveries."}</h1>
              <p>
                {w
                  ? w.description
                  : "Listen, make, read and explore. Choose your own adventure, at your own pace."}
              </p>
              <div className="world-actions">
                <Link
                  className="world-primary"
                  href={`/${resume?.slug ?? recommended.slug}`}
                >
                  {resume ? "Continue learning" : "Let’s explore"}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link className="world-secondary" href="/learning-progress">
                  My progress
                </Link>
              </div>
              <p className="world-note">
                Short adventures · No timers · Always time to try again
              </p>
            </div>
            <div className="world-hero-art" aria-hidden="true">
              <span className="world-orbit one">Aa</span>
              <span className="world-orbit two">123</span>
              <span className="world-orbit three">✎</span>
              <Guide />
            </div>
          </section>
          {!world && (
            <>
              <div className="world-section-heading">
                <h2>Where shall we go?</h2>
                <span>Three worlds. Your pace.</span>
              </div>
              <div className="world-cards">
                {WORLDS.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/worlds/${item.id}`}
                    className="world-card"
                    style={{ background: item.color }}
                  >
                    <span className="world-card-number">
                      0{index + 1} / EXPLORE
                    </span>
                    <span className="world-symbol" aria-hidden="true">
                      {item.symbol}
                    </span>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <span className="world-card-footer">
                      {GAMES.filter((g) => g.world === item.id).length} games{" "}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
          {world && (
            <>
              <section className="world-panel">
                <p className="world-eyebrow">Your skill trail</p>
                <h2>One discovery leads to another.</h2>
                <p className="world-muted">
                  Start near the beginning, or choose a familiar skill for
                  practice.
                </p>
                <ol className="skill-map">
                  {SKILLS[world].map((skill, i) => {
                    const games = GAMES.filter(
                        (g) => g.world === world && g.skill === skill.id,
                      ),
                      status = stage(p.skills[`${world}:${skill.id}`]);
                    return (
                      <li key={skill.id}>
                        <Link href={`/${games[0]?.slug ?? recommended.slug}`}>
                          <span className="skill-node" aria-hidden="true">
                            {status === "Consistent" ? "✓" : i + 1}
                          </span>
                          <span>
                            <strong>{skill.title}</strong>
                            <small>{status}</small>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
              <div className="world-section-heading">
                <h2>Choose an adventure</h2>
                <span>
                  {GAMES.filter((g) => g.world === world).length} ways to
                  practise
                </span>
              </div>
              <div className="world-game-grid">
                {GAMES.filter((g) => g.world === world).map((g) => (
                  <Link
                    href={`/${g.slug}`}
                    key={g.id}
                    className="world-game-card"
                  >
                    <span className="world-eyebrow">
                      {g.id} ·{" "}
                      {p.games[g.slug]?.sessions
                        ? "★ Explored"
                        : "Ready to explore"}
                    </span>
                    <h3>{g.title}</h3>
                    <p>{g.description}</p>
                    <span className="world-link">
                      {p.session?.game === g.slug ? "Continue" : "Play"} →
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
          <section className="world-practice">
            <div>
              <p className="world-eyebrow">
                A little practice, whenever you’re ready
              </p>
              <h2>{recommended.title}</h2>
              <p>{recommended.description}</p>
              <span className="world-note">
                Recommended from your practice history. No streaks to keep.
              </span>
            </div>
            <Link className="world-primary" href={`/${recommended.slug}`}>
              Try this adventure →
            </Link>
          </section>
          {!world && (
            <section className="world-classics">
              <div className="world-section-heading">
                <h2>Your familiar favourites</h2>
                <span>Keep exploring</span>
              </div>
              <GameLibrary />
            </section>
          )}
        </>
      )}
      {view === "progress" && (
        <>
          <header className="world-page-heading">
            <p className="world-eyebrow">For parents & teachers</p>
            <h1>Every little step counts.</h1>
            <p>
              Local learning observations to help choose the next activity.
              These are practice records, not diagnostic assessments.
            </p>
          </header>
          <div className="world-stat-grid">
            <div>
              <strong>{total}</strong>
              <span>Discoveries</span>
            </div>
            <div>
              <strong>
                {Object.values(p.games).filter((g) => g.sessions > 0).length}
              </strong>
              <span>Games explored</span>
            </div>
            <div>
              <strong>
                {
                  Object.values(p.skills).filter(
                    (s) => stage(s) === "Consistent",
                  ).length
                }
              </strong>
              <span>Consistent skills</span>
            </div>
          </div>
          {WORLDS.map((w) => (
            <section className="world-panel" key={w.id}>
              <h2>{w.title}</h2>
              <div className="world-table-wrap">
                <table>
                  <caption className="sr-only">
                    {w.title} practice observations
                  </caption>
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Practice stage</th>
                      <th>Independent</th>
                      <th>Supported</th>
                      <th>Hints / replay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS[w.id].map((skill) => {
                      const o = p.skills[`${w.id}:${skill.id}`];
                      return (
                        <tr key={skill.id}>
                          <th scope="row">{skill.title}</th>
                          <td>{stage(o)}</td>
                          <td>{o?.independent ?? 0}</td>
                          <td>{o?.supported ?? 0}</td>
                          <td>
                            {o?.hints ?? 0} / {o?.replays ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {SKILLS[w.id].flatMap((skill) => {
                const o = p.skills[`${w.id}:${skill.id}`];
                return Object.entries(o?.confusions ?? {})
                  .filter(([, n]) => n >= 2)
                  .slice(0, 2)
                  .map(([pair, n]) => (
                    <p
                      className="world-observation"
                      key={`${skill.id}:${pair}`}
                    >
                      {skill.title}: {pair.replace("→", " was selected as ")} in{" "}
                      {n} attempts. Try a short guided activity together.
                    </p>
                  ));
              })}
            </section>
          ))}
          <section className="world-panel">
            <h2>How to read these observations</h2>
            <p>
              Independent means correct on the first attempt without hints,
              extra replay or a visual audio fallback. Supported includes
              retries, guided tracing and self-reviewed handwriting. Drawing
              activities are practice, not automated handwriting assessment.
            </p>
            <p>
              “Developing” starts after 3 independent discoveries. “Consistent”
              needs at least 8, with at least 80% independent successes across
              successes and retries. These transparent product rules are
              starting points for review, not validated clinical cut-offs.
            </p>
            <p>
              Timing is kept only in broad bands. It never changes a learner’s
              rewards or difficulty.
            </p>
            <button className="world-secondary" onClick={download}>
              Export local progress
            </button>
          </section>
        </>
      )}
      {view === "settings" && (
        <>
          <header className="world-page-heading">
            <p className="world-eyebrow">Make yourself comfortable</p>
            <h1>Your learning space.</h1>
            <p>
              Choose a presentation that feels right. Skill level is independent
              of age.
            </p>
          </header>
          <section className="world-panel world-settings">
            <fieldset>
              <legend>Presentation</legend>
              {(["young", "growing", "older"] as const).map((t) => (
                <label key={t}>
                  <input
                    type="radio"
                    name="theme"
                    checked={p.settings.theme === t}
                    onChange={() =>
                      save({ ...p, settings: { ...p.settings, theme: t } })
                    }
                  />
                  <span>
                    <strong>
                      {t === "young"
                        ? "Young learner"
                        : t === "growing"
                          ? "Growing learner"
                          : "Older learner"}
                    </strong>
                    <small>
                      {t === "young"
                        ? "Warm colours and a friendly guide"
                        : t === "growing"
                          ? "Clean adventure colours and quieter decoration"
                          : "Neutral colours, simple shapes and no mascot"}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="world-field">
              English voice accent
              <select
                value={p.settings.accent}
                onChange={(e) =>
                  save({
                    ...p,
                    settings: {
                      ...p.settings,
                      accent: e.target.value as Progress["settings"]["accent"],
                    },
                  })
                }
              >
                <option value="en-IN">India English</option>
                <option value="en-GB">UK English</option>
                <option value="en-US">US English</option>
              </select>
            </label>
            <p className="world-muted">
              Uses an available device voice. The selected accent may fall back
              to another English voice. Reviewed isolated phoneme recordings are
              still required for final phonics narration.
            </p>
            <label>
              <input
                type="checkbox"
                checked={p.settings.voice}
                onChange={(e) =>
                  save({
                    ...p,
                    settings: { ...p.settings, voice: e.target.checked },
                  })
                }
              />{" "}
              Spoken guidance
            </label>
            <label>
              <input
                type="checkbox"
                checked={p.settings.motion}
                onChange={(e) =>
                  save({
                    ...p,
                    settings: { ...p.settings, motion: e.target.checked },
                  })
                }
              />{" "}
              Gentle motion (device reduced-motion preference takes priority)
            </label>
            <label className="world-field">
              Preferred name for My Name
              <input
                maxLength={12}
                value={p.settings.name}
                autoComplete="off"
                onChange={(e) =>
                  save({
                    ...p,
                    settings: {
                      ...p.settings,
                      name: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z ]/g, ""),
                    },
                  })
                }
                placeholder="English letters, up to 12"
              />
            </label>
            <p className="world-note">
              Optional. Saved only in this browser and used only inside My Name.
              No voice recordings are collected.
            </p>
          </section>
          <section className="world-panel">
            <h2>Your data stays here.</h2>
            <p>
              These 34 activities use this browser’s storage. No account,
              microphone or network analytics are used. Clearing browser data
              removes local progress.
            </p>
            <div className="world-actions">
              <button className="world-secondary" onClick={download}>
                Export progress
              </button>
              <button
                className="world-secondary"
                onClick={() => setConfirm(true)}
              >
                Clear Learning World data
              </button>
            </div>
          </section>
        </>
      )}
      {view === "rewards" && (
        <>
          <header className="world-page-heading">
            <p className="world-eyebrow">Collected through practice</p>
            <h1>A little collection of big steps.</h1>
            <p>
              Each finished adventure adds a badge. Visit whenever you like.
            </p>
          </header>
          <div className="world-game-grid">
            {GAMES.filter((g) => p.games[g.slug]?.sessions).map((g) => (
              <Link
                className="world-game-card reward-card"
                key={g.id}
                href={`/${g.slug}`}
              >
                <span aria-hidden="true">✦</span>
                <h2>{g.badge}</h2>
                <p>{g.title}</p>
              </Link>
            ))}
          </div>
          {!Object.values(p.games).some((g) => g.sessions) && (
            <section className="world-panel">
              <Guide />
              <h2>Your collection is ready to begin.</h2>
              <Link className="world-primary" href={`/${recommended.slug}`}>
                Explore an adventure
              </Link>
            </section>
          )}
        </>
      )}
      {!available && (
        <p role="status" className="world-storage-note">
          This browser cannot save progress. You can still explore during this
          visit.
        </p>
      )}
      {confirm && (
        <Dialog
          labelledBy="clear-title"
          onClose={() => setConfirm(false)}
          className="world-dialog bg-white p-6 rounded-3xl"
        >
          <h2 id="clear-title">Clear this Learning World?</h2>
          <p>
            This removes progress, the preferred name and settings for these 34
            games from this browser.
          </p>
          <button
            className="world-primary"
            onClick={() => {
              setAvailable(worldStore.clear());
              set(fresh());
              setConfirm(false);
            }}
          >
            Clear local data
          </button>
          <button className="world-secondary" onClick={() => setConfirm(false)}>
            Keep my progress
          </button>
        </Dialog>
      )}
    </WorldFrame>
  );
}
