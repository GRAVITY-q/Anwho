import React, { useState } from 'react';
import { useGame, ROLE } from '../context/GameContext';
import { User, AlertTriangle, CheckCircle } from 'lucide-react';
import GlassButton from './GlassButton';

function VotingPhase() {
    const { state, dispatch } = useGame();
    // In Fast Mode, we allow multiple selections (array). In Normal, single selection (string/number).
    const [selection, setSelection] = useState(state.gameMode === 'fast' ? [] : null);
    const [isReady, setIsReady] = useState(false);

    const currentPlayer = state.players[state.currentPlayerIndex];

    const handleSelect = (id) => {
        if (state.gameMode === 'fast') {
            let newSelection = Array.isArray(selection) ? [...selection] : [];

            if (id === 'SKIP') {
                // Skip is exclusive
                setSelection(['SKIP']);
                return;
            }

            // If we previously selected SKIP, clear it
            if (newSelection.includes('SKIP')) {
                newSelection = [];
            }

            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(item => item !== id);
            } else {
                // Limit selection to the number of remaining impostors
                const remainingImpostorsCount = state.players.filter(p => !p.isEliminated && p.role === ROLE.IMPOSTOR).length;

                if (newSelection.length < remainingImpostorsCount) {
                    newSelection.push(id);
                } else {
                    // Optional: You could replace the oldest selection here if desired, 
                    // but strict limit prevents accidental votes.
                    // For better UX, we'll allow replacing the first selection if we are at limit of 1,
                    // otherwise, just block changes if we are taking multiple. 
                    // Let's implement strict limit for clarity: "You can only select X players."
                    // But if count is 1, let's allow toggle behavior (standard radio button feel).
                    if (remainingImpostorsCount === 1) {
                        newSelection = [id];
                    }
                }
            }
            setSelection(newSelection);
        } else {
            // Normal mode - single select
            setSelection(id);
        }
    };

    const isSelected = (id) => {
        if (Array.isArray(selection)) {
            return selection.includes(id);
        }
        return selection === id;
    };

    const handleConfirmVote = () => {
        if (selection && (Array.isArray(selection) ? selection.length > 0 : true)) {
            if (state.gameMode === 'fast') {
                dispatch({ type: 'FAST_VOTE', payload: selection });
            } else {
                dispatch({ type: 'CAST_VOTE', payload: selection });
                dispatch({ type: 'NEXT_TURN' });
                setIsReady(false);
                setSelection(null);
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
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.08)'
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
                <GlassButton variant="primary" onClick={() => setIsReady(true)}>
                    I am {currentPlayer.name}
                </GlassButton>
            </div>
        );
    }

    const limit = state.gameMode === 'fast'
        ? state.players.filter(p => !p.isEliminated && p.role === ROLE.IMPOSTOR).length
        : 1;

    return (
        <div className="center-content fade-in" style={{ justifyContent: 'flex-start', paddingTop: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-2xl)' }}>
                {state.gameMode === 'fast'
                    ? `Group Vote: Select ${limit} Impostor${limit > 1 ? 's' : ''}`
                    : "Who is the Impostor?"}
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-md)',
                width: '100%',
                marginBottom: 'var(--spacing-xl)',
                overflowY: 'auto',
                padding: 'var(--spacing-xs)', // Add padding to prevent clipping of scaled items/shadows
                paddingBottom: '20px'
            }}>
                {state.players.filter(p => !p.isEliminated).map(player => {
                    // Tie Breaker Filter
                    if (state.voteCandidates && !state.voteCandidates.includes(player.id)) {
                        return null;
                    }

                    return (
                        <button
                            key={player.id}
                            onClick={() => handleSelect(player.id)}
                            disabled={state.gameMode !== 'fast' && player.id === currentPlayer.id}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: isSelected(player.id)
                                    ? 'linear-gradient(135deg, var(--accent-error), #b91c1c)'
                                    : 'rgba(30, 41, 59, 0.6)',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                border: isSelected(player.id) ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                                fontWeight: 'bold',
                                fontSize: 'var(--font-size-base)',
                                opacity: (state.gameMode !== 'fast' && player.id === currentPlayer.id) ? 0.5 : 1,
                                transform: isSelected(player.id) ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected(player.id) ? '0 10px 20px rgba(239, 68, 68, 0.3)' : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {player.name}
                            {isSelected(player.id) && (
                                <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
                                    <CheckCircle size={14} color="white" />
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Hide SKIP button in Interview Mode */}
                {state.gameMode !== 'interview' && (
                    <button
                        onClick={() => handleSelect('SKIP')}
                        style={{
                            padding: 'var(--spacing-md)',
                            background: isSelected('SKIP') ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.05)',
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
                )}
            </div>

            <GlassButton
                variant="primary"
                onClick={handleConfirmVote}
                disabled={!(selection && (Array.isArray(selection) ? selection.length > 0 : true))}
                style={{
                    marginTop: 'auto',
                    marginBottom: 'var(--spacing-lg)',
                    opacity: (selection && (Array.isArray(selection) ? selection.length > 0 : true)) ? 1 : 0.5,
                    transform: (selection && (Array.isArray(selection) ? selection.length > 0 : true)) ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.3s ease'
                }}
            >
                Confirm Vote <CheckCircle size={20} style={{ marginLeft: '8px' }} />
            </GlassButton>
        </div>
    );
}

export default VotingPhase;
