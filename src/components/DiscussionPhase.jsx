import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Timer, Users, Vote } from 'lucide-react';

function DiscussionPhase() {
    const { state, dispatch } = useGame();
    const [timeLeft, setTimeLeft] = useState(state.discussionTime);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const handleStartVoting = () => {
        dispatch({ type: 'START_VOTING' });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="center-content fade-in">
            <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Discussion Time
            </h2>

            <div style={{
                fontSize: '4rem',
                fontWeight: '800',
                background: timeLeft < 10
                    ? 'linear-gradient(to right, #ef4444, #f87171)'
                    : 'linear-gradient(to right, var(--text-primary), var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 'var(--spacing-xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontVariantNumeric: 'tabular-nums'
            }}>
                {formatTime(timeLeft)}
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
                justifyContent: 'center',
                marginBottom: 'auto',
                width: '100%'
            }}>
                {state.players.filter(p => !p.isEliminated).map(player => (
                    <div key={player.id} style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)'
                    }}>
                        {player.name}
                    </div>
                ))}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
                Identify the Impostor before time runs out!
            </p>

            <button className="btn-primary" onClick={handleStartVoting}>
                {state.gameMode === 'fast' ? 'ELIMINATE' : 'Start Voting'} <Vote size={20} style={{ marginLeft: '8px' }} />
            </button>
        </div>
    );
}

export default DiscussionPhase;
