import { useState } from 'react';

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
        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '720px' }}>
            <h3>Additive Secret Sharing Generator</h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <label>
                Secret:
                <input
                    type="number"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    style={{ width: '100%' }}
                />
                </label>
                <label>
                Prime Field Order:
                <input
                    type="number"
                    value={primeOrder}
                    onChange={(e) => setPrimeOrder(e.target.value)}
                    style={{ width: '100%' }}
                />
                </label>
            </div>

            <button onClick={share} style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}>
                Generate
            </button>

            {shares !== null && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginTop: '1rem' }}>
                {shares[0]} + {shares[1]} + {shares[2]} + {shares[3]} + {shares[4]} = {secret} mod {primeOrder}
                </p>
            )}
        </div>
    )
}
