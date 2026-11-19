import { useState } from 'react';

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
        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '720px' }}>
            <h3>Additive Secret Sharing Generator</h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <label>
                Secret:
                <input
                    type="number"
                    value={secret}
                    onChange={(e) => setSecret(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
                </label>
                <label>
                Ring modulus:
                <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
                </label>
            </div>

            <button onClick={share} style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}>
                Generate
            </button>
            {(shares == null) && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginTop: '1rem' }}>
                Click the button above to generate shares!
                </p>
            )}
            {(shares !== null && secret < order && secret >= 0) && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginTop: '1rem' }}>
                {shares[0]} + {shares[1]} + {shares[2]} + {shares[3]} + {shares[4]} ≡ {secret} mod {order}
                </p>
            )}
            {(shares !== null && secret >= order) && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginTop: '1rem' }}>
                secret must be between 0 and {order-1}
                </p>
            )}
            {(shares !== null && order < 2) && (
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', marginTop: '1rem' }}>
                order must be greater than 2
                </p>
            )}
        </div>
    )
}
