import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { User, AlertTriangle, CheckCircle } from 'lucide-react';

function VotingPhase() {
    const { state, dispatch } = useGame();
    const [selectedSuspect, setSelectedSuspect] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const currentPlayer = state.players[state.currentPlayerIndex];

    const handleConfirmVote = () => {
        if (selectedSuspect) {
            if (state.gameMode === 'fast') {
                dispatch({ type: 'FAST_VOTE', payload: selectedSuspect });
            } else {
                dispatch({ type: 'CAST_VOTE', payload: selectedSuspect });
                dispatch({ type: 'NEXT_TURN' });
                setIsReady(false);
                setSelectedSuspect(null);
            }
        }
    };

    if (state.gameMode !== 'fast' && !isReady) {
        return (
            <div className="center-content fade-in">
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '30px',
                    borderRadius: '50%',
                    marginBottom: 'var(--spacing-lg)',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)'
                }}>
                    <User size={64} style={{ color: 'var(--text-accent)' }} />
                </div>
                <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Pass phone to</h2>
                <h1 style={{
                    fontSize: 'var(--font-size-3xl)',
                    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 'var(--spacing-2xl)'
                }}>
                    {currentPlayer.name}
                </h1>
                <button className="btn-primary" onClick={() => setIsReady(true)}>
                    I am {currentPlayer.name}
                </button>
            </div>
        );
    }

    return (
        <div className="center-content fade-in" style={{ justifyContent: 'flex-start', paddingTop: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-2xl)' }}>
                {state.gameMode === 'fast' ? "Group Vote: Who to Eliminate?" : "Who is the Impostor?"}
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                width: '100%',
                marginBottom: 'var(--spacing-xl)',
                overflowY: 'auto',
                paddingBottom: '20px'
            }}>
                {state.players.filter(p => !p.isEliminated).map(player => (
                    <button
                        key={player.id}
                        onClick={() => setSelectedSuspect(player.id)}
                        disabled={state.gameMode !== 'fast' && player.id === currentPlayer.id}
                        style={{
                            padding: 'var(--spacing-md)',
                            background: selectedSuspect === player.id
                                ? 'linear-gradient(135deg, var(--accent-error), #b91c1c)'
                                : 'rgba(30, 41, 59, 0.6)',
                            color: 'white',
                            borderRadius: 'var(--radius-md)',
                            border: selectedSuspect === player.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 'bold',
                            fontSize: 'var(--font-size-base)',
                            opacity: (state.gameMode !== 'fast' && player.id === currentPlayer.id) ? 0.5 : 1,
                            transform: 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: selectedSuspect === player.id ? '0 10px 20px rgba(239, 68, 68, 0.3)' : 'none',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {player.name}
                        {selectedSuspect === player.id && (
                            <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
                                <User size={14} />
                            </div>
                        )}
                    </button>
                ))}

                <button
                    onClick={() => setSelectedSuspect('SKIP')}
                    style={{
                        padding: 'var(--spacing-md)',
                        background: selectedSuspect === 'SKIP' ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontWeight: '600',
                        fontSize: 'var(--font-size-base)',
                        gridColumn: '1 / -1',
                        letterSpacing: '0.05em'
                    }}
                >
                    SKIP VOTE
                </button>
            </div>

            <button
                className="btn-primary"
                onClick={handleConfirmVote}
                disabled={!selectedSuspect}
                style={{
                    marginTop: 'auto',
                    marginBottom: 'var(--spacing-lg)',
                    opacity: selectedSuspect ? 1 : 0.5,
                    transform: selectedSuspect ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.3s ease'
                }}
            >
                Confirm Vote <CheckCircle size={20} style={{ marginLeft: '8px' }} />
            </button>
        </div>
    );
}

export default VotingPhase;
