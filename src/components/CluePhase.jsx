import React from 'react';
import { useGame } from '../context/GameContext';
import { MessageSquare, User } from 'lucide-react';

function CluePhase() {
    const { state, dispatch } = useGame();

    const startPlayer = state.players[state.fastModeSetup?.startPlayerIndex || 0];
    const direction = state.fastModeSetup?.direction || 'Clockwise';

    const handleNext = () => {
        if (state.gameMode === 'fast') {
            dispatch({ type: 'START_VOTING' });
        } else {
            dispatch({ type: 'START_DISCUSSION' });
        }
    };

    return (
        <div className="center-content fade-in">
            <h1 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-3xl)' }}>
                Game On!
            </h1>

            <div className="card">
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Category</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {CATEGORIES.find(c => c.id === state.currentCategory)?.name || state.currentCategory}
                    </p>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Start with</p>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--accent-primary)', marginBottom: 'var(--spacing-lg)' }}>
                    {startPlayer.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: 'var(--spacing-lg)' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔄</span>
                    <h3 style={{ fontSize: 'var(--font-size-xl)' }}>{direction}</h3>
                </div>

                <p style={{ color: 'var(--text-secondary)' }}>
                    Everyone gives a one-word clue. <br />
                    {state.gameMode === 'fast' ? "Vote immediately!" : "Then start the discussion."}
                </p>
            </div>

            <div style={{ marginTop: 'auto', width: '100%' }}>
                <button className="btn-primary" onClick={handleNext}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {state.gameMode === 'fast' ? "Ready to Vote" : "Start Discussion"} <MessageSquare size={20} />
                    </span>
                </button>
            </div>
        </div>
    );
}

export default CluePhase;
