import { Fragment, useState } from "react";
import styles from "./demo.module.css";

const leafNames = ["A", "B", "C", "D"];
const parentNames = ["A–B", "C–D"];
const levels = [["Root"], parentNames, leafNames];
const steps = ["Commit", "Open", "Verify"];
const coinResults = ["Heads", "Tails"];
const hashLength = 5;
const encoder = new TextEncoder();

async function hash(prefix, ...parts) {
  const bytes = new Uint8Array(1 + parts.reduce((size, part) => size + part.length, 0));
  bytes[0] = prefix;
  let offset = 1;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return hex(new Uint8Array(digest)).slice(0, hashLength);
}

const hashLeaf = (message, salt) => hash(0, encoder.encode(message), salt);
const hashParent = (left, right) => hash(1, encoder.encode(left + right));

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createTree() {
  const leaves = await Promise.all(leafNames.map(async () => {
    const random = globalThis.crypto.getRandomValues(new Uint8Array(17));
    const message = coinResults[random[0] % coinResults.length];
    const salt = random.slice(1);
    return { message, salt, hash: await hashLeaf(message, salt) };
  }));
  const parents = await Promise.all([
    hashParent(leaves[0].hash, leaves[1].hash),
    hashParent(leaves[2].hash, leaves[3].hash),
  ]);
  return { leaves, parents, root: await hashParent(...parents) };
}

function openLeaf(tree, index) {
  const leafSibling = index ^ 1;
  const parentSibling = Math.floor(index / 2) ^ 1;
  const { message, salt } = tree.leaves[index];
  return {
    index, message, salt,
    siblings: [
      { name: leafNames[leafSibling], hash: tree.leaves[leafSibling].hash, left: leafSibling % 2 === 0 },
      { name: parentNames[parentSibling], hash: tree.parents[parentSibling], left: parentSibling === 0 },
    ],
  };
}

async function recomputePath(message, { salt, siblings }) {
  const path = [{ digest: await hashLeaf(message, salt) }];
  for (const sibling of siblings) {
    const child = path.at(-1).digest;
    const [left, right] = sibling.left ? [sibling.hash, child] : [child, sibling.hash];
    path.push({ left, right, digest: await hashParent(left, right) });
  }
  return path;
}

const xAt = (level, index) => 360 * (index + 0.5) / levels[level].length;
const yAt = (level) => 34 + level * 77;

function MerkleDiagram({ tree, opening, path }) {
  const selected = opening ? [0, Math.floor(opening.index / 2), opening.index] : [];

  return (
    <svg className={styles.diagram} viewBox="0 0 360 220" role="img"
      aria-label="Four leaves A, B, C, and D. A and B form the left branch, C and D form the right branch, and the branches form the root.">
      {levels.slice(1).flatMap((labels, index) => labels.map((label, i) => (
        <line key={label} x1={xAt(index, Math.floor(i / 2))} y1={yAt(index)}
          x2={xAt(index + 1, i)} y2={yAt(index + 1)} className={styles.edge}
          data-selected={selected[index + 1] === i} />
      )))}
      {levels.flatMap((labels, level) => labels.map((label, index) => {
        const onPath = selected[level] === index;
        const sibling = level > 0 && opening && index === (selected[level] ^ 1);
        const digest = level === 0 ? tree?.root
          : sibling ? opening.siblings[2 - level].hash : onPath ? path?.[2 - level].digest : undefined;
        const width = level === 2 ? 72 : 94;
        const kind = sibling ? "sibling" : onPath ? "path" : undefined;

        return (
          <g key={label} transform={`translate(${xAt(level, index)} ${yAt(level)})`}>
            <rect className={styles.treeNode} data-kind={kind}
              x={-width / 2} y="-23" width={width} height="46" rx="8" />
            <text className={styles.vertexLabel} y={digest ? -8 : 0}>{label}</text>
            {digest && <text className={styles.digest} y="11">{digest}</text>}
          </g>
        );
      }))}
    </svg>
  );
}

function VerificationSteps({ opening, claim, path, root, matched }) {
  return (
    <section aria-label="Verification steps">
      <h4 className={styles.title}>Verification steps</h4>
      <p>For simplicity, each has is shortened to 5 characters.</p>
      <ol className={styles.verificationSteps}>
        <li>
          <strong>Hash the claim for leaf {leafNames[opening.index]}</strong>
          <p>
            <code>0x00 ‖ UTF-8("{claim}") ‖ 0x{hex(opening.salt)}</code> → <code>{path[0].digest}</code>
          </p>
          <p>Where 0x00 marks it as a leaf node and the final string is the blinding factor</p>
        </li>
        {path.slice(1).map(({ left, right, digest }, index) => {
          const sibling = opening.siblings[index];
          const joined = left + right;
          return (
            <li key={sibling.name}>
              <strong>Recompute the {index === 0 ? "parent" : "root"} hash</strong>
              <p>Then we concatenate left and right, with sibling {sibling.name} on the {sibling.left ? "left" : "right"}.</p>
              <p><code>"{left}" + "{right}"</code> → <code>{joined}</code></p>
              <p>Hash <code>0x01 ‖ UTF-8("{joined}")</code> → <code>{digest}</code></p>
              <p>Where 0x01 marks it as a parent node</p>
            </li>
          );
        })}
        <li>
          <strong>Compare with the committed root</strong>
          <p>Recomputed <code>{path.at(-1).digest}</code> {matched ? "=" : "≠"} committed <code>{root}</code>.</p>
        </li>
      </ol>
    </section>
  );
}

export default function MerkleTree() {
  const [tree, setTree] = useState(null);
  const [opening, setOpening] = useState(null);
  const [claim, setClaim] = useState("");
  const [path, setPath] = useState(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");

  const step = opening ? 2 : tree ? 1 : 0;
  const busy = pending !== null;
  const root = tree?.root;
  const matched = path !== null && path.at(-1).digest === root;

  async function commit() {
    setError("");
    if (!globalThis.crypto?.subtle) {
      setError("Open this page over HTTPS or localhost to use SHA-256.");
      return;
    }
    setPending("commit");
    try {
      setTree(await createTree());
      setOpening(null);
      setPath(null);
    } catch {
      setError("The commitment could not be computed. Try again.");
    } finally {
      setPending(null);
    }
  }

  function open(index) {
    const proof = openLeaf(tree, index);
    setOpening(proof);
    setClaim(proof.message);
    setPath(null);
    setError("");
  }

  async function verify() {
    setError("");
    setPending("verify");
    try {
      setPath(await recomputePath(claim, opening));
    } catch {
      setError("The proof could not be checked. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section id="merkle-tree-demo" className={styles.demo} aria-label="Interactive Merkle tree">
      <header className={styles.toolbar}>
        <h3 className={styles.title}>Merkle Tree Commitment Scheme Demo</h3>
      </header>
      <div className={styles.layout}>
        <div className={styles.board}>
          <p className={styles.boardLabel}>Four-leaf Merkle tree</p>
          <MerkleDiagram tree={tree} opening={opening} path={path} />
          {opening && (
            <ul className={styles.legend}>
              <li><span data-kind="path" aria-hidden="true" />Path to recompute</li>
              <li><span data-kind="sibling" aria-hidden="true" />Sibling hashes supplied</li>
            </ul>
          )}
        </div>

        <div className={styles.controls}>
          <ol className={styles.steps} aria-label="Protocol steps">
            {steps.map((label, index) => (
              <li key={label} aria-current={step === index ? "step" : undefined}>{label}</li>
            ))}
          </ol>

          <div role="status" aria-atomic="true">
            {!tree && (
              <p>Xavier hashes four coin results with fresh blinding factors. He hashes pairs up the tree and sends Yasmina the single root.</p>
            )}
            {tree && !opening && <p>Yasmina has the root. Open any leaf to send its coin result, blinding factor, and two sibling hashes.</p>}
            {opening && !path && (
              <p>Yasmina hashes the claimed result with its blinding factor. At each branch, she hashes the left and right child hashes in that order.</p>
            )}
            {path && (
              <div className={styles.outcome} data-accepted={matched}>
                <strong>{matched ? "Proof accepted" : "Proof rejected"}</strong>
                <p>{matched ? "The roots match." : "The computed root differs from the commitment."}</p>
              </div>
            )}
          </div>

          {error && <p className={styles.outcome} data-accepted="false" role="alert">{error}</p>}

          {tree && (
            <div className={styles.leafChoices} role="group" aria-label="Open a leaf">
              {leafNames.map((name, index) => (
                <button type="button" key={name} aria-pressed={opening?.index === index}
                  className={styles.leafButton} disabled={busy} onClick={() => open(index)}>
                  Open {name}
                </button>
              ))}
            </div>
          )}
          {opening && (
            <label className={styles.field}>
              Claimed result for leaf {leafNames[opening.index]}
              <select value={claim} disabled={busy} onChange={(event) => { setClaim(event.target.value); setPath(null); }}>
                {coinResults.map((result) => <option key={result}>{result}</option>)}
              </select>
              <span className={styles.hint}>Change the result to see a tampered attempt.</span>
            </label>
          )}

          <div className={styles.actions}>
            {opening && (
              <button type="button" className={styles.primary} disabled={busy} onClick={verify}>
                {pending === "verify" ? "Verifying…" : "Verify proof"}
              </button>
            )}
            <button type="button" className={tree ? undefined : styles.primary} disabled={busy} onClick={commit}>
              {pending === "commit" ? "Hashing…" : tree ? "New commitment" : "Commit four coin results"}
            </button>
          </div>
        </div>
      </div>

      {tree && (
        <footer className={styles.footer}>
          <dl className={styles.values}>
            <dt>Committed root</dt>
            <dd><code>{root}</code></dd>
          </dl>
          {path && <VerificationSteps opening={opening} claim={claim} path={path} root={root} matched={matched} />}
          {/* {opening && (
            <details>
              <summary>Opening data for leaf {leafNames[opening.index]}</summary>
              <dl className={styles.values}>
                <dt>Opened result</dt>
                <dd>{opening.message}</dd>
                <dt>Blinding factor</dt>
                <dd><code>{hex(opening.salt)}</code></dd>
                {opening.siblings.map((sibling) => (
                  <Fragment key={sibling.name}>
                    <dt>{sibling.name} hash ({sibling.left ? "left" : "right"} sibling)</dt>
                    <dd><code>{sibling.hash}</code></dd>
                  </Fragment>
                ))}
              </dl>
            </details>
          )} */}
        </footer>
      )}
    </section>
  );
}
