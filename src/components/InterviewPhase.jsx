import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MessageSquare, ArrowRight, User } from 'lucide-react';
import GlassButton from './GlassButton';

function InterviewPhase() {
    const { state, dispatch } = useGame();
    const [isThinking, setIsThinking] = useState(false);

    // Safety check
    if (!state.currentQuestion) {
        // Should not happen if logic is correct
        return <div className="card">Loading...</div>;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];

    const handleNext = () => {
        setIsThinking(true);
        setTimeout(() => {
            dispatch({ type: 'NEXT_TURN' });
            setIsThinking(false);
        }, 500);
    };

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h1 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-2xl)' }}>
                Round {state.interviewRound}/2
            </h1>

            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{
                        margin: '0 auto var(--spacing-md)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <User size={40} color="white" />
                    </div>

                    <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)' }}>
                        {currentPlayer.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        It's your turn to answer!
                    </p>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        color: '#f59e0b'
                    }}>
                        <MessageSquare size={16} />
                        <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', fontWeight: 'bold' }}>Question</span>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.4' }}>
                        "{state.currentQuestion}"
                    </p>
                </div>

                <GlassButton
                    variant="primary"
                    onClick={handleNext}
                    disabled={isThinking}
                    style={{ width: '100%' }}
                >
                    {isThinking ? '...' : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            Next Player <ArrowRight size={20} />
                        </div>
                    )}
                </GlassButton>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-md)' }}>
                Answer truthfully unless you are the Impostor!
            </p>
        </div>
    );
}

export default InterviewPhase;
