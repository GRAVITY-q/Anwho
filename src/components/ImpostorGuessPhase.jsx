import React, { useState } from 'react';
import { useGame, ROLE } from '../context/GameContext';
import { UserX, AlertTriangle, Key } from 'lucide-react';
import GlassButton from './GlassButton';

function ImpostorGuessPhase() {
    const { state, dispatch } = useGame();
    const [selectedWord, setSelectedWord] = useState(null);

    const handleGuess = () => {
        if (selectedWord) {
            dispatch({ type: 'IMPOSTOR_GUESS', payload: selectedWord });
        }
    };

    const eliminatedPlayer = state.eliminatedId ? state.players.find(p => p.id === state.eliminatedId) : null;
    const wasImpostor = eliminatedPlayer?.role === ROLE.IMPOSTOR;

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                {wasImpostor ? (
                    <UserX size={64} className="pop-in" color="var(--accent-error)" />
                ) : (
                    <AlertTriangle size={64} className="pop-in" color="var(--accent-warning)" />
                )}

                <h1 style={{ color: wasImpostor ? 'var(--accent-error)' : 'var(--accent-warning)', fontSize: 'var(--font-size-2xl)', marginTop: 'var(--spacing-md)' }}>
                    {wasImpostor ? "Impostor Caught!" : "Crewmate Ejected!"}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {wasImpostor
                        ? "But wait... one last chance to steal the win."
                        : "Impostor controls the game. Guess the word to seal the victory."}
                </p>
            </div>

            <div className="card" style={{ border: '2px solid var(--accent-error)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: 'var(--spacing-lg)',
                    color: 'var(--text-primary)'
                }}>
                    <Key size={20} color="#fbbf24" />
                    <span style={{ fontWeight: 'bold' }}>GUESS THE SECRET WORD</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--spacing-xl)' }}>
                    {state.impostorGuessOptions.map((word) => (
                        <GlassButton
                            key={word}
                            variant="secondary"
                            style={{
                                height: '54px',
                                background: selectedWord === word ? 'var(--accent-error)' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: selectedWord === word ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                                transform: selectedWord === word ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.2s ease',
                            }}
                            onClick={() => setSelectedWord(word)}
                        >
                            {word}
                        </GlassButton>
                    ))}
                </div>

                <GlassButton
                    variant="primary"
                    onClick={handleGuess}
                    disabled={!selectedWord}
                    style={{
                        width: '100%'
                    }}
                >
                    Submit Guess
                </GlassButton>
            </div>
        </div>
    );
}

export default ImpostorGuessPhase;
