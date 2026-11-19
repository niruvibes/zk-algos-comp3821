import { useState } from 'react';
import styles from './demo.module.css';

export default function test({initialPrimeOrder, initialSecret}) {
    const [primeOrder, setPrimeOrder] = useState(initialPrimeOrder)
    const [secret, setSecret] = useState(initialSecret)
    const [shares, setShares] = useState(null);

    const share = () => {
        const getRandom = () => Math.floor(Math.random() * primeOrder)
        const result = Math.floor(Math.random() * primeOrder)
        const shares = [0, 0, 0, 0, 0]
        shares[0] = getRandom()
        shares[1] = getRandom()
        shares[2] = getRandom()
        shares[3] = getRandom()
        shares[4] = (secret - shares[0] - shares[1] - shares[2] - shares[3]) % primeOrder
        shares[4] = (shares[4] + primeOrder) % primeOrder
        setShares(shares)
    }

    return (
        <section className={styles.demo} aria-label="Additive secret sharing generator">
            <header className={styles.toolbar}>
                <h3 className={styles.title}>Additive Secret Sharing Generator</h3>
            </header>

            <div className={styles.layout}>
                <div className={styles.board}>
                    <p className={styles.boardLabel}>Generated shares</p>
                    <div className={styles.result} role="status">
                        {shares === null ? (
                            <p>Generate five shares to see how they add up modulo the prime field order.</p>
                        ) : (
                            <p className={styles.outcome}>
                                {shares.join(' + ')} ≡ <strong>{secret}</strong> mod {primeOrder}
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.controls}>
                    <label className={styles.field}>
                        Secret
                        <input type="number" value={secret}
                            onChange={(e) => setSecret(e.target.value)} />
                    </label>
                    <label className={styles.field}>
                        Prime field order
                        <input type="number" value={primeOrder}
                            onChange={(e) => setPrimeOrder(e.target.value)} />
                    </label>
                    <button className={styles.primary} type="button" onClick={share}>Generate</button>
                </div>
            </div>
        </section>
    )
}
