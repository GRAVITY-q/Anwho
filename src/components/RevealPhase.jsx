import React, { useState } from 'react';
import { useGame, ROLE } from '../context/GameContext';
import { Eye, User, Fingerprint } from 'lucide-react';

function RevealPhase() {
    const { state, dispatch } = useGame();
    const [isFlipped, setIsFlipped] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const currentPlayer = state.players[state.currentPlayerIndex];

    const handleCreateNext = (e) => {
        e.stopPropagation();
        setIsFlipped(false);
        setIsReady(false);
        dispatch({ type: 'NEXT_REVEAL' });
    };

    const handleCardClick = () => {
        setIsFlipped(!isFlipped);
    };

    if (!isReady) {
        return (
            <div className="center-content fade-in" style={{ paddingTop: '80px' }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '40px',
                    borderRadius: '50%',
                    marginBottom: 'var(--spacing-xl)',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.1)'
                }}>
                    <User size={64} style={{ color: 'var(--text-accent)' }} />
                </div>

                <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-xl)' }}>Pass device to</h2>
                <h1 style={{
                    fontSize: 'var(--font-size-3xl)',
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    {currentPlayer.name}
                </h1>

                <button className="btn-primary" onClick={() => setIsReady(true)} style={{ marginTop: '75px' }}>
                    I am {currentPlayer.name}
                </button>
            </div>
        );
    }

    return (
        <div className="center-content fade-in" style={{ padding: '0' }}>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                Tap card to reveal role
            </p>

            <div className={`perspective-container ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
                <div className="flip-card-inner">
                    <div className="flip-card-front">
                        <Fingerprint size={80} style={{ opacity: 0.8, marginBottom: '20px' }} />
                        <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>TAP TO REVEAL</h2>
                    </div>

                    <div className={`flip-card-back ${currentPlayer.role === ROLE.IMPOSTOR && !state.fakeWord ? 'impostor-back' : 'crew-back'}`}>
                        {currentPlayer.role === ROLE.IMPOSTOR ? (
                            state.fakeWord ? (
                                // Deceived Impostor (Nightmare Mode) - Looks like Crew
                                <>
                                    <h1 style={{ color: 'var(--accent-success)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>CREW</h1>
                                    <p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>The secret word is</p>
                                    <h2 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--text-primary)' }}>{state.fakeWord}</h2>
                                </>
                            ) : (
                                // Normal Impostor
                                <>
                                    <h1 style={{ color: 'var(--accent-error)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>IMPOSTOR</h1>
                                    <p style={{ fontSize: 'var(--font-size-lg)', opacity: 0.9 }}>
                                        Blend in.<br />You don't know the word.
                                    </p>
                                    {state.enableHint && state.impostorHint && (
                                        <div style={{ marginTop: 'var(--spacing-lg)', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>HINT (Related Word)</p>
                                            <strong style={{ fontSize: '1.2rem', color: 'var(--accent-secondary)' }}>{state.impostorHint}</strong>
                                        </div>
                                    )}
                                </>
                            )
                        ) : (
                            // Real Crew
                            <>
                                <h1 style={{ color: 'var(--accent-success)', fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>CREW</h1>
                                <p style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>The secret word is</p>
                                <h2 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--text-primary)' }}>{state.secretWord}</h2>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isFlipped && (
                <button className="btn-primary" onClick={handleCreateNext} style={{ marginTop: '0', maxWidth: '300px', background: 'white', color: 'black' }}>
                    GOT IT
                </button>
            )}
        </div>
    );
}

export default RevealPhase;
