import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getRandomWord, getVagueHint, CATEGORIES } from '../data/words';

// Game Phases
export const PHASE = {
    SETUP: 'SETUP',
    REVEAL: 'REVEAL',
    CLUE: 'CLUE',
    DISCUSSION: 'DISCUSSION',
    VOTE: 'VOTE',
    RESULT: 'RESULT',
    GAME_OVER: 'GAME_OVER',
};

// Roles
export const ROLE = {
    CREW: 'CREW',
    IMPOSTOR: 'IMPOSTOR',
};

const initialState = {
    phase: PHASE.SETUP,
    players: [], // Array of { id: 1, name: 'Alice', role: ROLE.CREW, isEliminated: false }
    playerCount: 4,
    impostorCount: 1,
    playerNames: {}, // { 1: 'Alice', 2: 'Bob' }
    category: 'food',
    secretWord: '',
    currentPlayerIndex: 0,
    votes: {}, // { voterId: suspectId }
    winner: null, // ROLE.CREW or ROLE.IMPOSTOR
    discussionTime: 60, // seconds
    gameMode: 'fast', // 'normal' | 'fast'
    enableHint: true,
    impostorHint: '',
    fastModeSetup: { startPlayerIndex: 0, direction: 'Clockwise' },
    isNightmareMode: false,
    fakeWord: null, // For Nightmare mode: If set, Impostor sees this instead of "Impostor" label
};

const GameContext = createContext();

function gameReducer(state, action) {
    switch (action.type) {
        case 'SET_PLAYER_COUNT':
            return { ...state, playerCount: action.payload };
        case 'SET_IMPOSTOR_COUNT':
            return { ...state, impostorCount: action.payload };
        case 'SET_PLAYER_NAME':
            return {
                ...state,
                playerNames: { ...state.playerNames, [action.payload.id]: action.payload.name }
            };
        case 'SET_CATEGORY':
            return { ...state, category: action.payload };
        case 'SET_GAME_MODE':
            return { ...state, gameMode: action.payload };
        case 'TOGGLE_HINT':
            return { ...state, enableHint: !state.enableHint };
        case 'TOGGLE_NIGHTMARE':
            return { ...state, isNightmareMode: !state.isNightmareMode };
        case 'START_GAME':
            // Assign Roles
            const newPlayers = Array.from({ length: state.playerCount }, (_, i) => ({
                id: i + 1,
                name: state.playerNames[i + 1] || `Player ${i + 1}`,
                role: ROLE.CREW,
                isEliminated: false,
            }));

            // Randomly assign impostors
            let assignedImpostors = 0;
            while (assignedImpostors < state.impostorCount) {
                const randomIndex = Math.floor(Math.random() * newPlayers.length);
                if (newPlayers[randomIndex].role === ROLE.CREW) {
                    newPlayers[randomIndex].role = ROLE.IMPOSTOR;
                    assignedImpostors++;
                }
            }

            // Select Secret Word
            const word = getRandomWord(state.category);

            // Generate Hint if enabled
            let hint = '';
            if (state.enableHint) {
                hint = getVagueHint(state.category, word);
            }

            // Fast Mode Setup
            const startIdx = Math.floor(Math.random() * newPlayers.length);
            const direction = Math.random() > 0.5 ? 'Clockwise' : 'Anti-Clockwise';

            // Nightmare Mode Logic
            let fakeWord = null;
            if (state.isNightmareMode) {
                // 50% chance the Impostor is deceived
                if (Math.random() > 0.5) {
                    const categoryObj = CATEGORIES.find(c => c.id === state.category);
                    if (categoryObj) {
                        const otherWords = categoryObj.words.filter(w => w !== word);
                        if (otherWords.length > 0) {
                            fakeWord = otherWords[Math.floor(Math.random() * otherWords.length)];
                        }
                    }
                }
            }

            return {
                ...state,
                phase: PHASE.REVEAL,
                players: newPlayers,
                secretWord: word || 'Error',
                impostorHint: hint,
                currentPlayerIndex: 0,
                votes: {},
                winner: null,
                fastModeSetup: { startPlayerIndex: startIdx, direction },
                fakeWord: fakeWord
            };

        case 'NEXT_REVEAL':
            if (state.currentPlayerIndex + 1 >= state.players.length) {
                return { ...state, phase: PHASE.CLUE, currentPlayerIndex: 0 };
            }
            return { ...state, currentPlayerIndex: state.currentPlayerIndex + 1 };

        case 'NEXT_TURN': // For Clue and Vote phases
            // Find next non-eliminated player
            let nextIndex = state.currentPlayerIndex + 1;
            while (nextIndex < state.players.length && state.players[nextIndex].isEliminated) {
                nextIndex++;
            }

            // If we looked through everyone and found no one, or reached end
            if (nextIndex >= state.players.length) {
                if (state.phase === PHASE.CLUE) {
                    return { ...state, phase: PHASE.DISCUSSION };
                } else if (state.phase === PHASE.VOTE) {
                    return { ...state, phase: PHASE.RESULT }; // Process votes logic needed here or in separate calculation
                }
            }

            return { ...state, currentPlayerIndex: nextIndex };

        case 'START_DISCUSSION':
            return { ...state, phase: PHASE.DISCUSSION };

        case 'START_VOTING':
            return { ...state, phase: PHASE.VOTE, currentPlayerIndex: 0 };

        case 'CAST_VOTE':
            return {
                ...state,
                votes: { ...state.votes, [state.currentPlayerIndex]: action.payload },
            };

        case 'FAST_VOTE':
            // In Fast Mode, everyone "votes" for the selected suspect to trigger elimination
            const suspectId = action.payload;
            const fastVotes = {};
            state.players.forEach(p => {
                if (!p.isEliminated) {
                    fastVotes[p.id] = suspectId;
                }
            });
            return {
                ...state,
                votes: fastVotes,
                phase: PHASE.RESULT
            };

        case 'ELIMINATE_PLAYER':
            const eliminatedPlayerId = action.payload;
            let updatedPlayers = state.players;

            // Only eliminate if valid ID provided (not -1 or null)
            if (eliminatedPlayerId && eliminatedPlayerId !== -1) {
                updatedPlayers = state.players.map(p =>
                    p.id === eliminatedPlayerId ? { ...p, isEliminated: true } : p
                );
            }

            // FAST MODE SUDDEN DEATH
            if (state.gameMode === 'fast') {
                const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedPlayerId);
                // If it was skip or no one eliminated, loop back? Or Impostor wins?
                // User said: "if we get it right the crew win if wrong then the impostor wins"
                // Assuming "Wrong" includes Skip or Crew.

                if (eliminatedPlayer && eliminatedPlayer.role === ROLE.IMPOSTOR) {
                    return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.CREW };
                } else {
                    return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.IMPOSTOR };
                }
            }

            // Check Win Condition (Normal Mode)
            const activeImpostors = updatedPlayers.filter(p => !p.isEliminated && p.role === ROLE.IMPOSTOR);
            const activeCrew = updatedPlayers.filter(p => !p.isEliminated && p.role === ROLE.CREW);

            if (activeImpostors.length === 0) {
                return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.CREW };
            }
            if (activeImpostors.length >= activeCrew.length) {
                return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.IMPOSTOR };
            }

            // If no win, go back to Clue phase for next round
            return { ...state, players: updatedPlayers, phase: PHASE.CLUE, currentPlayerIndex: 0, votes: {} };

        case 'RESET_GAME':
            return {
                ...initialState,
                // Keep settings that usually persist
                playerCount: state.playerCount,
                impostorCount: state.impostorCount,
                playerNames: state.playerNames,
                category: state.category,
                gameMode: state.gameMode,
                enableHint: state.enableHint,
                isNightmareMode: state.isNightmareMode
            };

        default:
            return state;
    }
}

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}
