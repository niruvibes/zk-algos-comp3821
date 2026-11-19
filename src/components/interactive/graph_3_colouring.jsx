import { useId, useRef, useState } from "react";
import styles from "./graph_3_colouring.module.css";

const vertices = {
  A: [180, 38],
  B: [310, 127],
  C: [260, 232],
  D: [100, 232],
  E: [50, 127],
};

const edges = [
  ["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"],
  ["A", "E"], ["A", "C"], ["A", "D"],
];

const colourings = {
  honest: { A: 0, B: 1, C: 2, D: 1, E: 2 },
  cheating: { A: 0, B: 2, C: 2, D: 1, E: 2 },
};

const palette = [
  { name: "Coral", fill: "#f8b7a7" },
  { name: "Teal", fill: "#8cdbcb" },
  { name: "Violet", fill: "#cfc2f2" },
];

const steps = ["Commit", "Challenge", "Open"];
const actions = ["Commit colours", "Pick a random edge", "Open both endpoints"];

function randomIndex(length) {
  const value = new Uint8Array(1);
  const limit = 256 - (256 % length);
  do {
    window.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}

function permuteColours(colouring) {
  const available = [...palette];
  const permutation = palette.map(() => available.splice(randomIndex(available.length), 1)[0]);
  return Object.fromEntries(
    Object.entries(colouring).map(([vertex, colour]) => [vertex, permutation[colour]]),
  );
}

function Graph({ round, canChallenge, onChallenge }) {
  const challenged = round?.edge;

  return (
    <svg className={styles.graph} viewBox="0 0 360 270" role="img"
      aria-label={`Public graph. Edges ${edges.map((edge) => edge.join(" to ")).join(", ")}.`}>
      {edges.map((edge) => {
        const [from, to] = edge;
        const [x1, y1] = vertices[from];
        const [x2, y2] = vertices[to];

        return (
          <g key={edge.join("")}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              className={styles.edge} data-selected={edge === challenged} />
            {canChallenge && (
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.hitArea}
                onClick={() => onChallenge(edge)} />
            )}
          </g>
        );
      })}
      {Object.entries(vertices).map(([vertex, [x, y]]) => {
        const selected = challenged?.includes(vertex);
        const colour = selected && round.opened ? round.colours[vertex] : null;
        const locked = Boolean(round && !colour);

        return (
          <g key={vertex} transform={`translate(${x} ${y})`}>
            <circle r="23" className={styles.vertex} data-selected={Boolean(selected)}
              fill={colour?.fill ?? (locked ? "#f2e8d6" : "#fffdf8")} />
            <text y={locked ? -5 : 1} className={styles.vertexLabel}>{vertex}</text>
            {locked && (
              <g className={styles.lock}>
                <rect x="-4" y="6" width="8" height="6" rx="1" />
                <path d="M-2.5 6 V4a2.5 2.5 0 0 1 5 0v2" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function Graph3Colouring() {
  const modeName = useId();
  const primaryAction = useRef(null);
  const [mode, setMode] = useState("honest");
  const [round, setRound] = useState(null);
  const [results, setResults] = useState({ accepted: 0, rejected: 0 });

  const edge = round?.edge;
  const opened = round?.opened;
  const canChallenge = Boolean(round && !edge);
  const step = edge ? 2 : round ? 1 : 0;
  const roundNumber = results.accepted + results.rejected + (opened ? 0 : 1);
  const revealed = opened ? edge.map((vertex) => round.colours[vertex]) : [];
  const accepted = opened && revealed[0] !== revealed[1];

  function reset() {
    setRound(null);
    setResults({ accepted: 0, rejected: 0 });
  }

  function challenge(selectedEdge) {
    if (canChallenge) {
      setRound({ ...round, edge: selectedEdge });
      primaryAction.current?.focus();
    }
  }

  function advance() {
    if (!round || opened) {
      setRound({ colours: permuteColours(colourings[mode]), edge: null, opened: false });
    } else if (canChallenge) {
      challenge(edges[randomIndex(edges.length)]);
    } else {
      const outcome = round.colours[edge[0]] === round.colours[edge[1]] ? "rejected" : "accepted";
      setRound({ ...round, opened: true });
      setResults((previous) => ({ ...previous, [outcome]: previous[outcome] + 1 }));
    }
  }

  return (
    <section className={styles.demo} aria-label="Interactive 3-colouring proof">
      <header className={styles.toolbar}>
        <fieldset className={styles.mode}>
          <legend>Yasmina’s strategy</legend>
          <label>
            <input type="radio" name={modeName} checked={mode === "honest"}
              onChange={() => { setMode("honest"); reset(); }} />
            Honest
          </label>
          <label>
            <input type="radio" name={modeName} checked={mode === "cheating"}
              onChange={() => { setMode("cheating"); reset(); }} />
            Cheating
          </label>
        </fieldset>
        <button type="button" disabled={!round} onClick={() => { reset(); primaryAction.current?.focus(); }}>
          Reset rounds
        </button>
      </header>

      <div className={styles.layout}>
        <div className={styles.board}>
          <p className={styles.boardLabel}>Public graph</p>
          <Graph round={round} canChallenge={canChallenge} onChallenge={challenge} />
        </div>

        <div className={styles.controls}>
          <p className={styles.round}>Round {roundNumber}</p>
          <ol className={styles.steps} aria-label="Protocol steps">
            {steps.map((label, index) => (
              <li key={label} aria-current={index === step ? "step" : undefined}>
                {label}
              </li>
            ))}
          </ol>

          <div className={styles.status} role="status" aria-atomic="true">
            {!round && <p>Yasmina shuffles the three colour labels and locks one colour behind each vertex.</p>}
            {canChallenge && <p>All five colours are locked. As Xavier, challenge an edge by choosing it below or on the graph.</p>}
            {edge && !opened && <p>Xavier challenged <strong>{edge.join("–")}</strong>. Yasmina opens only vertices {edge[0]} and {edge[1]}.</p>}
            {opened && (
              <div className={styles.outcome} data-accepted={accepted}>
                <strong>{accepted ? "Round accepted" : "Round rejected"}</strong>
                <p>
                  {edge[0]} is {revealed[0].name.toLowerCase()} and {edge[1]} is {revealed[1].name.toLowerCase()}.
                  {" "}{accepted ? "The colours differ." : "The colours match."}
                </p>
              </div>
            )}
          </div>

          <button className={styles.primary} type="button" ref={primaryAction} onClick={advance}>
            {opened ? "Commit for next round" : actions[step]}
          </button>
          {canChallenge && (
            <div className={styles.edgeChoices} role="group" aria-label="Edges to challenge">
              {edges.map((choice) => (
                <button type="button" key={choice.join("")}
                  aria-label={`Challenge edge ${choice.join(" to ")}`}
                  onClick={() => challenge(choice)}>
                  {choice.join("–")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.score}>
          <span><strong>{results.accepted}</strong> accepted</span>
          <span><strong>{results.rejected}</strong> rejected</span>
        </p>
        <details>
          <summary>Why repeat the proof?</summary>
          <p>
            An honest prover passes every edge check. The cheating strategy here has one conflicting
            edge out of seven. With independent random challenges, the chance that it passes all
            {" "}<em>r</em> rounds is (6/7)<sup>r</sup>.
          </p>
          <p>
            Each round starts with a fresh random permutation. On a valid colouring, that makes the
            two opened colours a uniformly random ordered pair of distinct colours, regardless of the secret
            colouring. The locks in this demo simulate cryptographic commitments.
            In the real protocol, Xavier also verifies both openings against the original commitments.
          </p>
        </details>
      </footer>
    </section>
  );
}
