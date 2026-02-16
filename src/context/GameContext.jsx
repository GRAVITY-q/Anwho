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
    categories: ['food'],
    currentCategory: null, // The category selected for the specific round
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
    impostorHistory: {}, // { playerId: count } - tracks how many times someone has been impostor
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
        case 'SWAP_PLAYER_NAMES':
            const { id1, id2 } = action.payload;
            const newNames = { ...state.playerNames };
            // Swap values
            const val1 = newNames[id1];
            const val2 = newNames[id2];

            // Handle undefined cases (if name wasn't set yet)
            if (val1 === undefined) delete newNames[id2];
            else newNames[id2] = val1;

            if (val2 === undefined) delete newNames[id1];
            else newNames[id1] = val2;

            return { ...state, playerNames: newNames };
        case 'TOGGLE_CATEGORY':
            const categoryId = action.payload;
            const isSelected = state.categories.includes(categoryId);
            let newCategories;

            if (isSelected) {
                // Prevent removing the last category
                if (state.categories.length <= 1) return state;
                newCategories = state.categories.filter(id => id !== categoryId);
            } else {
                newCategories = [...state.categories, categoryId];
            }
            return { ...state, categories: newCategories };
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

            // Assign Impostors with "Bad Luck Protection"
            let assignedCount = 0;
            const tempHistory = { ...state.impostorHistory };

            while (assignedCount < state.impostorCount) {
                const eligiblePlayers = newPlayers.filter(p => p.role === ROLE.CREW);
                if (eligiblePlayers.length === 0) break;

                // Calculate weights: 1 / (times_been_impostor + 1)
                let totalWeight = 0;
                const candidates = eligiblePlayers.map(p => {
                    const historyCount = tempHistory[p.id] || 0;
                    const weight = 1 / (historyCount + 1);
                    totalWeight += weight;
                    return { id: p.id, weight };
                });

                // Weighted Random Selection
                let randomVal = Math.random() * totalWeight;
                let selectedId = candidates[candidates.length - 1].id;

                for (const item of candidates) {
                    randomVal -= item.weight;
                    if (randomVal <= 0) {
                        selectedId = item.id;
                        break;
                    }
                }

                // Assign Role
                const playerIndex = newPlayers.findIndex(p => p.id === selectedId);
                if (playerIndex !== -1) {
                    newPlayers[playerIndex].role = ROLE.IMPOSTOR;
                    assignedCount++;
                    tempHistory[selectedId] = (tempHistory[selectedId] || 0) + 1;
                }
            }

            // Select Secret Word
            const currentCategory = state.categories[Math.floor(Math.random() * state.categories.length)];
            const word = getRandomWord(currentCategory);

            // Generate Hint if enabled
            let hint = '';
            if (state.enableHint) {
                hint = getVagueHint(currentCategory, word);
            }

            // Fast Mode Setup
            const startIdx = Math.floor(Math.random() * newPlayers.length);
            const direction = Math.random() > 0.5 ? 'Clockwise' : 'Anti-Clockwise';

            // Nightmare Mode Logic
            let fakeWord = null;
            if (state.isNightmareMode) {
                // 50% chance the Impostor is deceived
                if (Math.random() > 0.5) {
                    const categoryObj = CATEGORIES.find(c => c.id === currentCategory);
                    if (categoryObj) {
                        const otherWords = categoryObj.words.filter(w => w.word !== word);
                        if (otherWords.length > 0) {
                            fakeWord = otherWords[Math.floor(Math.random() * otherWords.length)].word;
                        }
                    }
                }
            }

            return {
                ...state,
                phase: PHASE.REVEAL,
                players: newPlayers,
                currentCategory: currentCategory, // Store the active category for this round
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
            console.log("Resetting game! robustly saving:", state.playerNames);
            return {
                ...initialState,
                // Keep settings that usually persist
                playerCount: state.playerCount,
                impostorCount: state.impostorCount,
                playerNames: { ...state.playerNames }, // Create fresh copy of names
                categories: [...state.categories], // Be safe with arrays too
                gameMode: state.gameMode,
                enableHint: state.enableHint,
                isNightmareMode: state.isNightmareMode,
                impostorHistory: state.impostorHistory || {}
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
