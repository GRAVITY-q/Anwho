import React, { useState, useEffect } from 'react';
import { useGame, PHASE, ROLE } from '../context/GameContext';
import { Trophy, Skull, RotateCcw, ArrowRight, Fingerprint } from 'lucide-react';

function ResultScreen() {
    const { state, dispatch } = useGame();
    const [displayState, setDisplayState] = useState('calculating'); // calculating, revealed, gameover
    const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
    const [voteTally, setVoteTally] = useState({});

    useEffect(() => {
        if (state.phase === PHASE.RESULT) {
            calculateVotes();
        } else if (state.phase === PHASE.GAME_OVER) {
            setDisplayState('gameover');
        }
    }, [state.phase]);

    const calculateVotes = () => {
        const tally = {};
        Object.values(state.votes).forEach(vote => {
            tally[vote] = (tally[vote] || 0) + 1;
        });
        setVoteTally(tally);

        // Find max votes
        let maxVotes = 0;
        let candidate = null;
        let isTie = false;

        for (const [player, count] of Object.entries(tally)) {
            if (count > maxVotes) {
                maxVotes = count;
                candidate = player;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        }

        // Delay for dramatic effect
        setTimeout(() => {
            const resultId = (isTie || candidate === 'SKIP' || !candidate) ? -1 : parseInt(candidate);

            if (state.gameMode === 'fast') {
                // In Fast Mode, go straight to result (Game Over handled by reducer)
                dispatch({ type: 'ELIMINATE_PLAYER', payload: resultId });
            } else {
                setEliminatedPlayer(resultId === -1 ? null : resultId);
                setDisplayState('revealed');
            }
        }, 3000); // 3 seconds suspense
    };

    const handleProceed = () => {
        if (state.phase === PHASE.GAME_OVER) {
            dispatch({ type: 'RESET_GAME' });
            return;
        }

        if (eliminatedPlayer) {
            dispatch({ type: 'ELIMINATE_PLAYER', payload: eliminatedPlayer });
        } else {
            dispatch({ type: 'ELIMINATE_PLAYER', payload: -1 });
        }
    };

    const [loadingText, setLoadingText] = useState('INITIALIZING SCAN');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (displayState !== 'calculating') return;

        // Simpler text cycling for the minimal loader
        const texts = ['ANALYZING', 'CALCULATING', 'VERIFYING'];
        let textIndex = 0;

        const textInterval = setInterval(() => {
            textIndex = (textIndex + 1) % texts.length;
            setLoadingText(texts[textIndex]);
        }, 1000);

        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 1, 100)); // Cap at 100
        }, 30);

        return () => {
            clearInterval(textInterval);
            clearInterval(progressInterval);
        };
    }, [displayState]);

    if (displayState === 'calculating') {
        return (
            <div className="center-content">
                {state.gameMode === 'fast' ? (
                    <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="4"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="var(--accent-primary)"
                                strokeWidth="4"
                                strokeDasharray="339.292"
                                strokeDashoffset={339.292 * (1 - progress / 100)}
                                style={{ transition: 'stroke-dashoffset 0.03s linear' }}
                            />
                        </svg>

                        <div style={{ position: 'absolute', textAlign: 'center', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <h2 style={{
                                fontSize: '0.8rem',
                                letterSpacing: '0.2em',
                                color: 'white',
                                fontWeight: '300',
                                marginBottom: '0',
                                opacity: 0.8
                            }}>
                                ANALYZING
                            </h2>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="fade-in" style={{ fontSize: 'var(--font-size-2xl)' }}>Tallying Votes...</h2>
                        <div className="loader" style={{
                            marginTop: '30px',
                            width: '40px',
                            height: '40px',
                            border: '4px solid rgba(255,255,255,0.1)',
                            borderTop: '4px solid var(--accent-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </>
                )}
            </div>
        );
    }

    if (displayState === 'gameover') {
        const isCrewWin = state.winner === ROLE.CREW;
        return (
            <div className="center-content fade-in" style={{
                justifyContent: 'flex-start',
                paddingTop: '80px',
                overflowY: 'auto',
                width: '100%',
                paddingBottom: '100px' // Space for fixed button
            }}>
                <div style={{
                    marginBottom: 'var(--spacing-lg)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        position: 'absolute',
                        width: '150px',
                        height: '150px',
                        background: isCrewWin ? 'var(--accent-success)' : 'var(--accent-error)',
                        filter: 'blur(50px)',
                        opacity: 0.3,
                        borderRadius: '50%',
                        zIndex: 0
                    }} />
                    <div style={{
                        color: isCrewWin ? 'var(--accent-success)' : 'var(--accent-error)',
                        transform: 'scale(1.2)',
                        zIndex: 1,
                        filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                    }}>
                        {isCrewWin ? <Trophy size={80} strokeWidth={1.5} /> : <Skull size={80} strokeWidth={1.5} />}
                    </div>
                </div>

                <h1 style={{
                    fontSize: '3.5rem',
                    marginBottom: 'var(--spacing-xs)',
                    background: isCrewWin
                        ? 'linear-gradient(to bottom, #86efac, #22c55e)'
                        : 'linear-gradient(to bottom, #fca5a5, #ef4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    lineHeight: 1
                }}>
                    {isCrewWin ? 'VICTORY' : 'DEFEAT'}
                </h1>

                <p style={{
                    color: isCrewWin ? '#86efac' : '#fca5a5',
                    fontSize: 'var(--font-size-lg)',
                    marginBottom: 'var(--spacing-xl)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    {isCrewWin ? 'Crew Wins' : 'Impostor Wins'}
                </p>

                <div className="card" style={{
                    marginBottom: 'var(--spacing-xl)',
                    textAlign: 'center',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        The Secrect Word
                    </p>
                    <div style={{
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: 'white',
                        textShadow: '0 0 30px rgba(255,255,255,0.3)'
                    }}>
                        {state.secretWord}
                    </div>
                </div>

                <div style={{ width: '100%', marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{
                        marginBottom: 'var(--spacing-md)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        paddingLeft: '4px'
                    }}>
                        Mission Report
                    </h3>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {state.players.map(p => (
                            <div key={p.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                background: p.role === ROLE.IMPOSTOR
                                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
                                    : 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: p.role === ROLE.IMPOSTOR
                                    ? '1px solid rgba(239, 68, 68, 0.3)'
                                    : '1px solid rgba(255,255,255,0.05)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: p.role === ROLE.IMPOSTOR ? 'var(--accent-error)' : 'var(--accent-secondary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                        {p.name}
                                        {p.role === ROLE.IMPOSTOR && state.fakeWord && (
                                            <span style={{ marginLeft: '6px', fontSize: '1rem' }} title="Deceived Impostor">👻</span>
                                        )}
                                    </span>
                                </div>

                                <span style={{
                                    fontWeight: '800',
                                    color: p.role === ROLE.IMPOSTOR ? '#fca5a5' : '#86efac',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    background: p.role === ROLE.IMPOSTOR ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                    letterSpacing: '0.05em'
                                }}>
                                    {p.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: '460px', /* slight padding from container max-width */
                    padding: '0 20px',
                    zIndex: 10
                }}>
                    <button className="btn-primary" onClick={() => dispatch({ type: 'RESET_GAME' })} style={{
                        boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
                        borderRadius: '16px',
                        padding: '18px'
                    }}>
                        <RotateCcw size={20} style={{ marginRight: '8px' }} /> Play Again
                    </button>
                </div>
            </div>
        );
    }

    // Revealed State (Round Result)
    return (
        <div className="center-content fade-in">
            <h1 style={{ marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-3xl)' }}>Vote Results</h1>

            <div style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
                {eliminatedPlayer ? (
                    <>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg) auto',
                            border: '2px solid var(--accent-error)',
                            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
                        }}>
                            <Skull size={60} color="var(--accent-error)" />
                        </div>
                        <h2 style={{ color: 'var(--accent-error)', fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-xs)' }}>
                            {state.players.find(p => p.id === eliminatedPlayer)?.name}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>was ejected.</p>

                        <div style={{
                            marginTop: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>ROLE REVEAL</p>
                            <strong style={{
                                fontSize: 'var(--font-size-2xl)',
                                color: state.players.find(p => p.id === eliminatedPlayer)?.role === ROLE.IMPOSTOR ? 'var(--accent-error)' : 'var(--accent-success)'
                            }}>
                                {state.players.find(p => p.id === eliminatedPlayer)?.role}
                            </strong>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '50%',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-lg) auto',
                            border: '2px solid var(--text-secondary)'
                        }}>
                            <span style={{ fontSize: '3rem' }}>🤷</span>
                        </div>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-2xl)' }}>No One Ejected</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Tie vote or skipped.</p>
                    </>
                )}
            </div>

            <button className="btn-primary" onClick={handleProceed}>
                {state.gameMode === 'fast' ? 'See Winner' : 'Next Round'} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
        </div>
    );
}

export default ResultScreen;
