'use client';

export default function OfflinePage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050505',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '2rem',
            gap: '1.5rem',
        }}>
            <div style={{ fontSize: '4rem' }}>🛡️</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6', margin: 0 }}>
                HerSecure
            </h1>
            <p style={{ color: '#999', maxWidth: 320, lineHeight: 1.6, margin: 0 }}>
                You're currently offline. Please check your internet connection to use HerSecure.
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2rem',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Try Again
            </button>
        </div>
    );
}
