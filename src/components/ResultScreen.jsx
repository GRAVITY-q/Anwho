import React, { useState, useEffect } from 'react';
import { useGame, PHASE, ROLE } from '../context/GameContext';
import { Trophy, Skull, RotateCcw, ArrowRight, Fingerprint, Scale } from 'lucide-react';
import GlassButton from './GlassButton';
const styles = {
    // Flows naturally inside the main container to support native scroll on iOS
    screenWrapper: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        minHeight: '70dvh', // Ensures centering even on short viewports
    },
    // Scrollable content area that grows
    scrollArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0 16px',
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
    },
    // Flows naturally at the bottom of the page content
    stickyBottom: {
        width: '100%',
        padding: '16px 0',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom) + 24px)',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '32px',
    },
    stickyButtonInner: {
        width: '100%',
        maxWidth: '460px',
    },
    // Big CTA button sizing for easy tapping
    bigButton: {
        boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '18px 24px',
        fontSize: '1.1rem',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
};

function ResultScreen() {
    const { state, dispatch } = useGame();
    const [displayState, setDisplayState] = useState('calculating');
    const [eliminatedIds, setEliminatedIds] = useState([]);
    const [voteTally, setVoteTally] = useState({});
    const [tieCandidates, setTieCandidates] = useState(null);

    useEffect(() => {
        if (state.phase === PHASE.RESULT) {
            calculateVotes();
        } else if (state.phase === PHASE.GAME_OVER) {
            setDisplayState('gameover');
        }
    }, [state.phase]);

    const calculateVotes = () => {
        // FAST MODE
        if (state.gameMode === 'fast') {
            const targets = state.fastModeVoteTargets || [];
            const validTargets = targets.filter(id => id !== 'SKIP' && id !== null);
            setTimeout(() => {
                setEliminatedIds(validTargets);
                setDisplayState('revealed');
            }, 1500);
            return;
        }

        // NORMAL MODE
        const tally = {};
        Object.values(state.votes).forEach(vote => {
            tally[vote] = (tally[vote] || 0) + 1;
        });
        setVoteTally(tally);

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

        setTimeout(() => {
            if (isTie && state.gameMode === 'interview') {
                const tied = Object.keys(tally).filter(id => tally[id] === maxVotes).map(id => parseInt(id));
                setTieCandidates(tied);
                setDisplayState('tie');
                return;
            }

            const resultId = (isTie || candidate === 'SKIP' || !candidate) ? null : parseInt(candidate);
            setEliminatedIds(resultId ? [resultId] : []);
            setDisplayState('revealed');
        }, 3000);
    };

    const handleProceed = () => {
        if (state.phase === PHASE.GAME_OVER) {
            dispatch({ type: 'RESET_GAME' });
            return;
        }

        if (displayState === 'tie') {
            dispatch({ type: 'START_TIEBREAKER', payload: tieCandidates });
            return;
        }

        const payload = eliminatedIds.length > 0 ? eliminatedIds : -1;
        dispatch({ type: 'ELIMINATE_PLAYER', payload: payload });
    };

    const [cycleState, setCycleState] = useState({ text: 'VICTORY', color: 'var(--accent-success)' });

    useEffect(() => {
        if (displayState !== 'calculating') return;
        const interval = setInterval(() => {
            setCycleState(prev => prev.text === 'VICTORY'
                ? { text: 'DEFEAT', color: 'var(--accent-error)' }
                : { text: 'VICTORY', color: 'var(--accent-success)' }
            );
        }, 150);
        return () => clearInterval(interval);
    }, [displayState]);

    // ─── CALCULATING STATE ────────────────────────────────
    if (displayState === 'calculating') {
        return (
            <div style={styles.screenWrapper}>
                <div style={{ ...styles.scrollArea, justifyContent: 'center', flex: 1 }}>
                    {state.gameMode === 'fast' ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 8vw, 3rem)',
                                fontWeight: '900',
                                color: cycleState.color,
                                letterSpacing: '0.1em',
                                transition: 'color 0.1s',
                                textShadow: `0 0 30px ${cycleState.color}`
                            }}>
                                {cycleState.text}
                            </h2>
                            <div style={{
                                marginTop: '24px',
                                width: '40px',
                                height: '40px',
                                border: '4px solid rgba(255,255,255,0.1)',
                                borderTop: '4px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h2 className="fade-in" style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>Tallying Votes...</h2>
                            <div style={{
                                marginTop: '30px',
                                width: '40px',
                                height: '40px',
                                border: '4px solid rgba(255,255,255,0.1)',
                                borderTop: '4px solid var(--accent-primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── TIE STATE ────────────────────────────────────────
    if (displayState === 'tie') {
        return (
            <div style={styles.screenWrapper}>
                <div style={styles.scrollArea} className="fade-in">
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '24px',
                        borderRadius: '50%',
                        marginBottom: '20px',
                        boxShadow: '0 0 40px rgba(255, 255, 255, 0.08)'
                    }}>
                        <Scale size={56} style={{ color: 'var(--text-accent)' }} />
                    </div>
                    <h1 style={{ marginBottom: '12px', fontSize: 'clamp(1.8rem, 7vw, 3rem)' }}>It's a Tie!</h1>
                    <p style={{
                        marginBottom: '24px',
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-lg)'
                    }}>
                        Re-voting between tied candidates...
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {tieCandidates && tieCandidates.map(id => {
                            const p = state.players.find(pl => pl.id === id);
                            if (!p) return null;
                            return (
                                <div key={id} style={{
                                    padding: '10px 20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {p.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div style={styles.stickyBottom}>
                    <div style={styles.stickyButtonInner}>
                        <GlassButton variant="primary" onClick={handleProceed} style={styles.bigButton} borderRadius={16}>
                            Start Tie-Breaker <ArrowRight size={20} />
                        </GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    // ─── GAME OVER STATE ──────────────────────────────────
    if (displayState === 'gameover') {
        const isCrewWin = state.winner === ROLE.CREW;
        const accentColor = isCrewWin ? 'var(--accent-success)' : 'var(--accent-error)';
        const lightColor = isCrewWin ? '#86efac' : '#fca5a5';
        const gradientText = isCrewWin
            ? 'linear-gradient(to bottom, #86efac, #22c55e)'
            : 'linear-gradient(to bottom, #fca5a5, #ef4444)';

        return (
            <div style={styles.screenWrapper}>
                <div style={styles.scrollArea} className="fade-in">
                    {/* Trophy / Skull Icon */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                    }}>
                        <div style={{
                            position: 'absolute',
                            width: '120px',
                            height: '120px',
                            background: accentColor,
                            filter: 'blur(50px)',
                            opacity: 0.3,
                            borderRadius: '50%',
                        }} />
                        <div style={{
                            color: accentColor,
                            zIndex: 1,
                            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                        }}>
                            {isCrewWin
                                ? <Trophy size={64} strokeWidth={1.5} />
                                : <Skull size={64} strokeWidth={1.5} />
                            }
                        </div>
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 'clamp(2.2rem, 10vw, 3.5rem)',
                        marginBottom: '4px',
                        background: gradientText,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                    }}>
                        {isCrewWin ? 'VICTORY' : 'DEFEAT'}
                    </h1>

                    <p style={{
                        color: lightColor,
                        fontSize: 'var(--font-size-base)',
                        marginBottom: '20px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        opacity: 0.8
                    }}>
                        {isCrewWin ? 'Crew Wins' : 'Impostor Wins'}
                    </p>

                    {/* Secret Word Card */}
                    <div style={{
                        marginBottom: '20px',
                        textAlign: 'center',
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        width: '100%',
                    }}>
                        <p style={{
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.15em',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                        }}>
                            The Secret Word
                        </p>
                        <div style={{
                            fontSize: 'clamp(1.8rem, 8vw, 3rem)',
                            fontWeight: '800',
                            color: 'white',
                            textShadow: '0 0 30px rgba(255,255,255,0.2)',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                        }}>
                            {state.secretWord}
                        </div>
                    </div>

                    {/* Mission Report - Player List */}
                    <div style={{ width: '100%', marginBottom: '8px' }}>
                        <h3 style={{
                            marginBottom: '12px',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            paddingLeft: '4px'
                        }}>
                            Mission Report
                        </h3>

                        <div style={{ display: 'grid', gap: '8px' }}>
                            {state.players.map(p => {
                                const isImp = p.role === ROLE.IMPOSTOR;
                                return (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: isImp
                                            ? 'linear-gradient(90deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))'
                                            : 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: isImp
                                            ? '1px solid rgba(239,68,68,0.25)'
                                            : '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                background: isImp ? 'var(--accent-error)' : 'var(--accent-secondary)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                flexShrink: 0,
                                            }}>
                                                {p.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                {p.name}
                                                {p.role === ROLE.IMPOSTOR && state.fakeWord && (
                                                    <span style={{ marginLeft: '6px', fontSize: '0.9rem' }} title="Deceived Impostor">👻</span>
                                                )}
                                            </span>
                                        </div>

                                        <span style={{
                                            fontWeight: '800',
                                            color: isImp ? '#fca5a5' : '#86efac',
                                            padding: '3px 10px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            background: isImp ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                            letterSpacing: '0.05em',
                                            flexShrink: 0,
                                        }}>
                                            {p.role}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sticky Play Again Button */}
                <div style={styles.stickyBottom}>
                    <div style={styles.stickyButtonInner}>
                        <GlassButton variant="primary" onClick={() => dispatch({ type: 'RESET_GAME' })} style={styles.bigButton} borderRadius={16}>
                            <RotateCcw size={20} /> Play Again
                        </GlassButton>
                    </div>
                </div>
            </div>
        );
    }

    // ─── REVEALED STATE (Round Result) ────────────────────
    return (
        <div style={styles.screenWrapper}>
            <div style={styles.scrollArea} className="fade-in">
                <h1 style={{ marginBottom: '24px', fontSize: 'clamp(1.8rem, 7vw, 3rem)' }}>Vote Results</h1>

                <div style={{ marginBottom: '16px', textAlign: 'center', width: '100%' }}>
                    {eliminatedIds.length > 0 ? (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '24px'
                        }}>
                            {eliminatedIds.map(id => {
                                const player = state.players.find(p => p.id === id);
                                if (!player) return null;
                                const isImpostor = player.role === ROLE.IMPOSTOR;
                                const color = isImpostor ? 'var(--accent-error)' : 'var(--accent-success)';
                                const bgColor = isImpostor ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
                                const borderColor = isImpostor ? 'var(--accent-error)' : 'var(--accent-success)';
                                const shadowColor = isImpostor ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)';

                                return (
                                    <div key={id} className="fade-in" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '160px',
                                        maxWidth: '220px',
                                        flex: '1 1 auto',
                                    }}>
                                        <div style={{
                                            background: bgColor,
                                            borderRadius: '50%',
                                            width: '96px',
                                            height: '96px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '14px',
                                            border: `2px solid ${borderColor}`,
                                            boxShadow: `0 0 30px ${shadowColor}`,
                                        }}>
                                            <Skull size={48} color={color} />
                                        </div>
                                        <h2 style={{
                                            color: color,
                                            fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
                                            marginBottom: '4px',
                                            wordBreak: 'break-word',
                                        }}>
                                            {player.name}
                                        </h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>was ejected.</p>

                                        <div style={{
                                            marginTop: '14px',
                                            padding: '12px 16px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            width: '100%'
                                        }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ROLE</p>
                                            <strong style={{
                                                fontSize: 'var(--font-size-lg)',
                                                color: color,
                                            }}>
                                                {player.role}
                                            </strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '50%',
                                width: '96px',
                                height: '96px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px auto',
                                border: '2px solid var(--text-secondary)'
                            }}>
                                <span style={{ fontSize: '2.5rem' }}>🤷</span>
                            </div>
                            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.4rem, 6vw, 2rem)' }}>No One Ejected</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Tie vote or skipped.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Continue Button */}
            <div style={styles.stickyBottom}>
                <div style={styles.stickyButtonInner}>
                    <GlassButton variant="primary" onClick={handleProceed} style={styles.bigButton} borderRadius={16}>
                        Continue <ArrowRight size={20} />
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}

export default ResultScreen;
