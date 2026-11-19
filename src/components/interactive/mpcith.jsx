import { useState } from 'react';

export default function mpc_in_the_head() {
    const order = 5 // must be prime
    const secret = 3
    const base = 3
    const pub = 1 
    const [shares, setShares] = useState(null);
    const [exp_shares, setExpShares] = useState(null);

    const share = () => {
        const getRandomExp = () => Math.floor(Math.random() * ind_order)
        const ind_order = order - 1
        const modwrap_exp = (n) => ((n % ind_order) + ind_order) % ind_order
        const shares = [0, 0, 0, 0]
        shares[0] = getRandomExp()
        shares[1] = getRandomExp()
        shares[2] = getRandomExp()
        shares[3] = modwrap_exp(secret - shares[0] - shares[1] - shares[2])
        setShares(shares)
        const modwrap = (n) => ((n % order) + order) % order
        const exponentiate = (b, x) => modwrap(b**x)
        exponentiated_shares = shares.map((x) => exponentiate(base, x))
        result = exponentiated_shares
    }

    return (
        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '720px' }}>
            <h3>Multi-party Computation in the Head Showcase</h3>

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
