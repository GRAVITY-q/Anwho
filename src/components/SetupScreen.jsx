import React, { useState } from 'react';
import { useGame, ROLE } from '../context/GameContext';
import { CATEGORIES } from '../data/words';
import { Users, UserX, Play, Zap, Lightbulb, Ghost, ChevronDown, ChevronUp, X, Check } from 'lucide-react';

function SetupScreen() {
    const { state, dispatch } = useGame();
    const [isNamesExpanded, setIsNamesExpanded] = useState(false);

    const handlePlayerCountChange = (delta) => {
        const newCount = Math.max(3, Math.min(12, state.playerCount + delta));
        dispatch({ type: 'SET_PLAYER_COUNT', payload: newCount });

        // Adjust impostors if needed (max ~half players to keep it fair)
        if (state.impostorCount >= newCount / 2) {
            dispatch({ type: 'SET_IMPOSTOR_COUNT', payload: Math.floor((newCount - 1) / 2) });
        }
    };

    const handleImpostorCountChange = (delta) => {
        const maxImpostors = Math.floor((state.playerCount - 1) / 2);
        const newCount = Math.max(1, Math.min(maxImpostors, state.impostorCount + delta));
        dispatch({ type: 'SET_IMPOSTOR_COUNT', payload: newCount });
    };

    const startGame = () => {
        dispatch({ type: 'START_GAME' });
    };

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '400px' }}>


            <div className="card">
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                    Players
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                    <button className="btn-secondary" style={{ width: '50px' }} onClick={() => handlePlayerCountChange(-1)}>-</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>
                        <Users size={24} />
                        {state.playerCount}
                    </div>
                    <button className="btn-secondary" style={{ width: '50px' }} onClick={() => handlePlayerCountChange(1)}>+</button>
                </div>

                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                    Impostors
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                    <button className="btn-secondary" style={{ width: '50px' }} onClick={() => handleImpostorCountChange(-1)}>-</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--accent-error)' }}>
                        <UserX size={24} />
                        {state.impostorCount}
                    </div>
                    <button className="btn-secondary" style={{ width: '50px' }} onClick={() => handleImpostorCountChange(1)}>+</button>
                </div>

                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                    Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.id })}
                            style={{
                                backgroundColor: state.category === cat.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: 'white',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                border: state.category === cat.id ? '2px solid white' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Player Names Trigger Card */}
            <div
                className="card"
                onClick={() => setIsNamesExpanded(true)}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                        Player Names
                    </label>
                    <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)'
                    }}>
                        Edit
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Array.from({ length: Math.min(state.playerCount, 4) }, (_, i) => i + 1).map(id => (
                        <span key={id} style={{
                            fontSize: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            color: state.playerNames[id] ? 'white' : 'var(--text-secondary)'
                        }}>
                            {state.playerNames[id] || `Player ${id}`}
                        </span>
                    ))}
                    {state.playerCount > 4 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px' }}>
                            +{state.playerCount - 4} more...
                        </span>
                    )}
                </div>
            </div>

            {/* Full Screen Player Name Editor Overlay */}
            {isNamesExpanded && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 100,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div
                        className="card"
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            margin: 0,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>Edit Players</h2>
                            <button
                                onClick={() => setIsNamesExpanded(false)}
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingRight: '4px' }}>
                            {Array.from({ length: state.playerCount }, (_, i) => i + 1).map(id => (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: 'var(--text-secondary)', width: '24px', fontSize: '0.9rem' }}>{id}.</span>
                                    <input
                                        type="text"
                                        placeholder={`Player ${id}`}
                                        maxLength={10}
                                        value={state.playerNames[id] || ''}
                                        autoFocus={id === 1}
                                        onChange={(e) => dispatch({ type: 'SET_PLAYER_NAME', payload: { id, name: e.target.value } })}
                                        style={{
                                            backgroundColor: 'var(--bg-primary)',
                                            border: '1px solid var(--bg-tertiary)',
                                            color: 'white',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: 'var(--radius-sm)',
                                            width: '100%',
                                            fontSize: 'var(--font-size-base)'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => setIsNamesExpanded(false)}
                            style={{ marginTop: 'var(--spacing-lg)' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Check size={20} /> Done
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <div className="card">
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                    Game Settings
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {state.gameMode === 'fast' ? <Zap size={20} color="var(--accent-primary)" /> : <Users size={20} color="var(--accent-secondary)" />}
                        <span>{state.gameMode === 'fast' ? 'Fast Mode' : 'Strategic Mode'}</span>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'SET_GAME_MODE', payload: state.gameMode === 'normal' ? 'fast' : 'normal' })}
                        style={{
                            background: state.gameMode === 'fast' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            width: '50px',
                            height: '28px',
                            borderRadius: '14px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: state.gameMode === 'fast' ? '24px' : '4px',
                            top: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'all 0.3s ease'
                        }} />
                    </button>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', marginTop: '-8px' }}>
                    {state.gameMode === 'fast' ? 'Group votes together. Quick & intense.' : 'Pass device to vote. Deep deduction.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lightbulb size={20} color="var(--accent-secondary)" />
                        <span>Impostor Hint</span>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_HINT' })}
                        style={{
                            background: state.enableHint ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            width: '50px',
                            height: '28px',
                            borderRadius: '14px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: state.enableHint ? '24px' : '4px',
                            top: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'all 0.3s ease'
                        }} />
                    </button>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', marginTop: '-8px' }}>
                    {state.enableHint ? 'Impostor gets a random related word.' : 'Impostor has no clue.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ghost size={20} color="var(--accent-error)" />
                        <span>Nightmare Mode</span>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_NIGHTMARE' })}
                        style={{
                            background: state.isNightmareMode ? 'var(--accent-error)' : 'var(--bg-tertiary)',
                            width: '50px',
                            height: '28px',
                            borderRadius: '14px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: state.isNightmareMode ? '24px' : '4px',
                            top: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'all 0.3s ease'
                        }} />
                    </button>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', marginTop: '-8px' }}>
                    {state.isNightmareMode ? 'Impostor might be deceived!' : 'Safe mode. Impostor knows their role.'}
                </p>
            </div>

            <button className="btn-primary" onClick={startGame}>
                START GAME
            </button>

            <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Pass the device to play together locally.
            </p>
        </div>
    );
}

export default SetupScreen;
