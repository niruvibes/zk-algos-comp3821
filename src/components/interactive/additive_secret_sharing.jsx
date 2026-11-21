import { useState } from 'react';
import styles from './demo.module.css';

export default function additive_secret_sharing({initialOrder, initialSecret}) {
    const [order, setOrder] = useState(initialOrder)
    const [secret, setSecret] = useState(initialSecret)
    const [shares, setShares] = useState(null);

    const share = () => {
        const getRandom = () => Math.floor(Math.random() * order)
        const modwrap = (n) => ((n % order) + order) % order
        const shares = [0, 0, 0, 0, 0]
        shares[0] = getRandom()
        shares[1] = getRandom()
        shares[2] = getRandom()
        shares[3] = getRandom()
        shares[4] = modwrap(secret - shares[0] - shares[1] - shares[2] - shares[3])
        setShares(shares)
    }

    return (
        <section id="additive-secret-sharing-demo" className={styles.demo} aria-label="Additive secret sharing generator">
            <header className={styles.toolbar}>
                <h3 className={styles.title}>Additive Secret Sharing Generator</h3>
            </header>

            <div className={styles.layout}>
                <div className={styles.board}>
                    <p className={styles.boardLabel}>Generated shares</p>
                    <div className={styles.result} role="status">
                        {shares === null ? (
                            <p>Generate five shares to see how they add up modulo the ring characteristic.</p>
                        ) : (
                            <p className={styles.outcome}>
                                {shares.join(' + ')} ≡ <strong>{secret}</strong> mod {order}
                            </p>
                        )}
                    </div>
                </div>
                {/*TODO lets make this into a table */}

                <div className={styles.controls}>
                    <label className={styles.field}>
                        Secret
                        <input type="number" value={secret}
                            onChange={(e) => setSecret(e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        Ring characteristic
                        <input type="number" value={order}
                            onChange={(e) => setOrder(Number(e.target.value))} />
                    </label>
                    <button className={styles.primary} type="button" onClick={share}>Generate</button>
                </div>
            </div>
        </section>
    )
}
