import { useId, useState } from "react";
import styles from "./demo.module.css";

const parties = ["P1", "P2", "P3", "P4", "P5"];
const modulus = 101;
const steps = [
  { id: "share", label: "Share", title: "Share the secret" },
  { id: "split", label: "Split", title: "Split each share into five parts", action: "Split each share" },
  { id: "send", label: "Send", title: "Send the parts to each party", action: "Send the parts" },
  { id: "combine", label: "Combine", title: "Combine the received parts", action: "Combine the parts" },
  { id: "reconstruct", label: "Reconstruct", title: "Reconstruct the secret", action: "Reconstruct secret" },
];

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function mod(value) {
  return ((value % modulus) + modulus) % modulus;
}

function randomShare() {
  const sample = new Uint16Array(1);
  const limit = Math.floor(65536 / modulus) * modulus;
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return sample[0] % modulus;
}

function split(input) {
  const shares = parties.slice(1).map(randomShare);
  shares.push(mod(input - sum(shares)));
  return shares;
}

function createRun(secret) {
  const shares = split(secret);
  const parts = shares.map(split);
  const received = parties.map((_, recipient) => parts.map((row) => row[recipient]));
  const newShares = received.map((partsForParty) => mod(sum(partsForParty)));
  return { secret, shares, parts, received, newShares };
}

function getMessages(run, step, selectedIndex) {
  const selected = parties[selectedIndex];
  const otherParties = parties.filter((party) => party !== selected);

  switch (step) {
    case "share":
      return parties.map((party, index) => ["You", party, `Share ${run.shares[index]}`]);
    case "send":
      return otherParties.map((party) => [
        selected, party, `Part ${run.parts[selectedIndex][parties.indexOf(party)]}`,
      ]);
    case "combine":
      return otherParties.map((party) => [
        party, selected, `Part ${run.received[selectedIndex][parties.indexOf(party)]}`,
      ]);
    case "reconstruct":
      return parties.map((party, index) => [party, "You", `New share ${run.newShares[index]}`]);
    default:
      return [];
  }
}

const positions = {
  You: [48, 130],
  P1: [270, 30],
  P2: [365, 90],
  P3: [345, 205],
  P4: [220, 225],
  P5: [170, 112],
};

function Diagram({ messages, selected, onSelect }) {
  const arrowId = useId();

  return (
    <svg className={styles.diagram} viewBox="0 0 410 260" role="img"
      aria-label="Share transfers among you and the five parties">
      <defs>
        <marker id={arrowId} markerWidth="8" markerHeight="8"
          refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L8 4 L0 8 Z" className={styles.arrowhead} />
        </marker>
      </defs>

      {messages.map(([from, to, label]) => {
        const [x1, y1] = positions[from];
        const [x2, y2] = positions[to];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);

        return (
          <line key={`${from}-${to}`} x1={x1} y1={y1}
            x2={x2 - 24 * dx / length}
            y2={y2 - 24 * dy / length}
            className={styles.edge} markerEnd={`url(#${arrowId})`}>
            <title>{`${from} → ${to}: ${label}`}</title>
          </line>
        );
      })}

      {Object.entries(positions).map(([name, [x, y]]) => (
        <g key={name} transform={`translate(${x}, ${y})`}
          className={onSelect && name !== "You" ? styles.party : undefined}
          onClick={onSelect && name !== "You" ? () => onSelect(name) : undefined}>
          <circle r="22" className={styles.vertex}
            data-selected={name === selected} />
          <text className={styles.vertexLabel}>{name}</text>
        </g>
      ))}
    </svg>
  );
}

function ShareTable({ label, shareLabel, shares, selected, received }) {
  return (
    <table aria-label={label} className={styles.table}>
      <thead>
        <tr>
          <th scope="col">Party</th>
          {received && <th scope="col">Parts added</th>}
          <th scope="col">{shareLabel}</th>
        </tr>
      </thead>
      <tbody>
        {parties.map((party, index) => (
          <tr key={party} data-selected={party === selected}>
            <th scope="row">{party}</th>
            {received && <td>{received[index].join(" + ")}</td>}
            <td>{shares[index]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PartsTable({ run, selected, sending }) {
  return (
    <div className={styles.tableScroll}>
      <table aria-label={sending ? "Where each part goes" : "Parts made from each share"}
        className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{sending ? "Sender" : "Party"}</th>
            {!sending && <th scope="col">Original share</th>}
            {parties.map((party) => (
              <th key={party} scope="col">{sending ? "To" : "For"} {party}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {run.parts.map((partsForParty, sender) => (
            <tr key={parties[sender]} data-selected={parties[sender] === selected}>
              <th scope="row">{parties[sender]}</th>
              {!sending && <td>{run.shares[sender]}</td>}
              {partsForParty.map((part, recipient) => (
                <td key={parties[recipient]}>
                  {part}{sending && sender === recipient && <small> kept</small>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [run, setRun] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState("P1");
  const selectedIndex = parties.indexOf(selected);
  const step = steps[stepIndex];
  const nextStep = steps[stepIndex + 1];

  function startRun(secret) {
    setRun(createRun(secret));
    setStepIndex(0);
  }

  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    startRun(Number(values.get("secret")));
  }

  return (
    <section id="secret-resharing-demo" className={styles.demo} aria-label="Interactive secret resharing">
      <header className={styles.toolbar}>
          <h3 className={styles.title}>Additive Secret Resharing Demo</h3>
      </header>
      <form className={styles.toolbar} onSubmit={submit}>
        <label className={styles.field}>
          Secret number
          <input name="secret" type="number" min="0" max={modulus - 1} defaultValue={67} required />
        </label>
        <button className={styles.primary} type="submit">Split and send</button>
      </form>

      <div className={styles.layout}>
        <div className={styles.board}>
          <p className={styles.boardLabel}>Share transfers</p>
          <Diagram messages={run ? getMessages(run, step.id, selectedIndex) : []}
            selected={run ? selected : undefined} onSelect={run ? setSelected : undefined} />
        </div>

        <div className={styles.controls}>
          <ol className={`${styles.steps} ${styles.wrapSteps}`} aria-label="Protocol steps">
            {steps.map((item, index) => (
              <li key={item.id} aria-current={index === stepIndex ? "step" : undefined}>{item.label}</li>
            ))}
          </ol>
          <h3 className={styles.title}>{step.title}</h3>

          {run ? (
            <>
              <label className={styles.field}>
                Inspect party
                <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                  {parties.map((party) => <option key={party}>{party}</option>)}
                </select>
              </label>
              {step.id === "share" && <p>{selected} receives the share {run.shares[selectedIndex]}.</p>}
              {step.id === "split" && (
                <p>{selected} splits {run.shares[selectedIndex]} into {run.parts[selectedIndex].join(" + ")} modulo {modulus}.</p>
              )}
              {step.id === "send" && (
                <p>The arrows show where {selected} sends its parts. Each party keeps the part addressed to itself.</p>
              )}
              {step.id === "combine" && (
                <p>{selected} adds its own kept part and the four parts received from the other parties. The remainder modulo {modulus} is its new share.</p>
              )}
              {step.id === "reconstruct" && (
                <div className={styles.outcome} role="status">
                  <p>Add the returned shares and take the remainder modulo {modulus}.</p>
                  <p>{run.newShares.join(" + ")} = {sum(run.newShares)}</p>
                  <p>Reconstructed secret <strong>{mod(sum(run.newShares))}</strong></p>
                </div>
              )}

              <div className={styles.actions}>
                {stepIndex > 0 && (
                  <button type="button" onClick={() => setStepIndex(stepIndex - 1)}>Back</button>
                )}
                {nextStep && (
                  <button className={styles.primary} type="button" onClick={() => setStepIndex(stepIndex + 1)}>
                    {nextStep.action}
                  </button>
                )}
                <button type="button" onClick={() => startRun(run.secret)}>Reshare</button>
              </div>
            </>
          ) : (
            <p>Enter a secret number from 0 to {modulus - 1} to split it into five shares.</p>
          )}
        </div>
      </div>

      {run && (
        <footer className={styles.footer}>
          {step.id === "share" && (
            <ShareTable label="Shares received by each party" shareLabel="Share received"
              shares={run.shares} selected={selected} />
          )}
          {(step.id === "split" || step.id === "send") && (
            <PartsTable run={run} selected={selected} sending={step.id === "send"} />
          )}
          {step.id === "combine" && (
            <ShareTable label="New share computed by each party" shareLabel="New share"
              shares={run.newShares} selected={selected} received={run.received} />
          )}
          {step.id === "reconstruct" && (
            <ShareTable label="Shares returned to you" shareLabel="Share returned"
              shares={run.newShares} selected={selected} />
          )}

        </footer>
      )}
    </section>
  );
}
