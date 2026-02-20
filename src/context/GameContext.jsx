import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getRandomWord, getVagueHint, CATEGORIES } from '../data/words';
import { INTERVIEW_QUESTIONS } from '../data/questions';

// Game Phases
export const PHASE = {
    SETUP: 'SETUP',
    REVEAL: 'REVEAL',
    CLUE: 'CLUE',
    INTERVIEW: 'INTERVIEW', // New Phase
    DISCUSSION: 'DISCUSSION',
    VOTE: 'VOTE',
    RESULT: 'RESULT',
    IMPOSTOR_GUESS: 'IMPOSTOR_GUESS', // New Phase
    GAME_OVER: 'GAME_OVER',
};

// Roles
export const ROLE = {
    CREW: 'CREW',
    IMPOSTOR: 'IMPOSTOR',
};

const initialState = {
    phase: PHASE.SETUP,
    players: [],
    playerCount: 4,
    impostorCount: 1,
    playerNames: {},
    categories: ['food'],
    currentCategory: null,
    currentQuestion: null,
    secretWord: '',
    currentPlayerIndex: 0,
    votes: {},
    winner: null,
    discussionTime: 60,
    gameMode: 'fast',
    enableHint: true,
    impostorHint: '',
    fastModeSetup: { startPlayerIndex: 0, direction: 'Clockwise' },
    isNightmareMode: false,
    fakeWord: null,
    impostorHistory: {},
    interviewRound: 1, // New State
    impostorGuessOptions: [], // New State
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
            const val1 = newNames[id1];
            const val2 = newNames[id2];
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

                let totalWeight = 0;
                const candidates = eligiblePlayers.map(p => {
                    const historyCount = tempHistory[p.id] || 0;
                    const weight = 1 / (historyCount + 1);
                    totalWeight += weight;
                    return { id: p.id, weight };
                });

                let randomVal = Math.random() * totalWeight;
                let selectedId = candidates[candidates.length - 1].id;

                for (const item of candidates) {
                    randomVal -= item.weight;
                    if (randomVal <= 0) {
                        selectedId = item.id;
                        break;
                    }
                }

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
                currentCategory: currentCategory,
                secretWord: word || 'Error',
                impostorHint: hint,
                currentPlayerIndex: 0,
                votes: {},
                winner: null,
                fastModeSetup: { startPlayerIndex: startIdx, direction },
                fakeWord: fakeWord,
                currentQuestion: null,
                interviewRound: 1,
                impostorGuessOptions: [],
                voteCandidates: null // Reset
            };

        case 'START_TIEBREAKER':
            return {
                ...state,
                phase: PHASE.VOTE,
                votes: {},
                voteCandidates: action.payload, // Array of player IDs
                currentPlayerIndex: 0
            };

        case 'NEXT_REVEAL':
            if (state.currentPlayerIndex + 1 >= state.players.length) {
                if (state.gameMode === 'interview') {
                    // Start Interview Phase
                    const firstQ = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
                    return { ...state, phase: PHASE.INTERVIEW, currentPlayerIndex: 0, interviewRound: 1, currentQuestion: firstQ };
                }
                return { ...state, phase: PHASE.CLUE, currentPlayerIndex: 0 };
            }
            return { ...state, currentPlayerIndex: state.currentPlayerIndex + 1 };

        case 'NEXT_TURN':
            // Logic for finding next player
            let nextIndex = state.currentPlayerIndex + 1;

            // For INTERVIEW phase, we iterate through ALL players (even eliminated? No, usually voting removes them, but interview implies active players). 
            // Standard check:
            while (nextIndex < state.players.length && state.players[nextIndex].isEliminated) {
                nextIndex++;
            }

            // End of list reached?
            if (nextIndex >= state.players.length) {
                if (state.phase === PHASE.CLUE) {
                    return { ...state, phase: PHASE.DISCUSSION };
                } else if (state.phase === PHASE.VOTE) {
                    return { ...state, phase: PHASE.RESULT };
                } else if (state.phase === PHASE.INTERVIEW) {
                    // Check rounds
                    if (state.interviewRound < 2) {
                        // Start Round 2
                        const nextQ = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
                        return {
                            ...state,
                            interviewRound: state.interviewRound + 1,
                            currentPlayerIndex: 0,
                            currentQuestion: nextQ
                        };
                    } else {
                        // End of Round 2 -> Go to Vote
                        return { ...state, phase: PHASE.VOTE, currentPlayerIndex: 0 };
                    }
                }
            }

            // Just moving to next player
            let updateState = { ...state, currentPlayerIndex: nextIndex };

            // If Interview, select NEW Question for next player
            if (state.phase === PHASE.INTERVIEW) {
                updateState.currentQuestion = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
            }

            return updateState;

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
            const suspectIds = Array.isArray(action.payload) ? action.payload : [action.payload];
            return {
                ...state,
                fastModeVoteTargets: suspectIds,
                phase: PHASE.RESULT
            };

        case 'ELIMINATE_PLAYER':
            const targets = Array.isArray(action.payload) ? action.payload : [action.payload];
            let updatedPlayers = [...state.players];
            let caughtImpostorsCount = 0;
            let wrongVote = false;

            targets.forEach(id => {
                if (id && id !== -1) {
                    const pIndex = updatedPlayers.findIndex(p => p.id === id);
                    if (pIndex !== -1) {
                        updatedPlayers[pIndex] = { ...updatedPlayers[pIndex], isEliminated: true };
                        if (updatedPlayers[pIndex].role === ROLE.IMPOSTOR) {
                            caughtImpostorsCount++;
                        } else {
                            wrongVote = true;
                        }
                    }
                }
            });

            // FAST MODE SUDDEN DEATH Logic
            if (state.gameMode === 'fast') {
                if (wrongVote) {
                    return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.IMPOSTOR };
                }
                const remainingImpostors = updatedPlayers.filter(p => !p.isEliminated && p.role === ROLE.IMPOSTOR);
                if (remainingImpostors.length === 0) {
                    return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.CREW };
                } else {
                    return { ...state, players: updatedPlayers, phase: PHASE.CLUE, currentPlayerIndex: 0, votes: {}, fastModeVoteTargets: [] };
                }
            }

            // INTERVIEW / NORMAL MODE Logic
            // INTERVIEW MODE Logic
            if (state.gameMode === 'interview') {
                // Always go to Impostor Guess, regardless of who was voted out
                const categoryObj = CATEGORIES.find(c => c.id === state.currentCategory);
                const allWords = categoryObj ? categoryObj.words.map(w => w.word) : [];
                const otherWords = allWords.filter(w => w !== state.secretWord);
                const decoys = otherWords.sort(() => 0.5 - Math.random()).slice(0, 5); // 5 decoys + 1 real = 6 options
                const options = [...decoys, state.secretWord].sort(() => 0.5 - Math.random());

                // Find who was eliminated for context
                const eliminatedPlayer = updatedPlayers.find(p => targets.includes(p.id));

                return {
                    ...state,
                    players: updatedPlayers,
                    phase: PHASE.IMPOSTOR_GUESS,
                    impostorGuessOptions: options,
                    winner: null,
                    eliminatedId: eliminatedPlayer ? eliminatedPlayer.id : null
                };
            }

            const activeImpostors = updatedPlayers.filter(p => !p.isEliminated && p.role === ROLE.IMPOSTOR);
            const activeCrew = updatedPlayers.filter(p => !p.isEliminated && p.role === ROLE.CREW);

            if (activeImpostors.length === 0) {
                return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.CREW };
            }
            if (activeImpostors.length >= activeCrew.length) {
                return { ...state, players: updatedPlayers, phase: PHASE.GAME_OVER, winner: ROLE.IMPOSTOR };
            }

            // Continue Game
            let nextQuestion = state.currentQuestion;
            if (state.gameMode === 'interview') {
                nextQuestion = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
            }
            return { ...state, players: updatedPlayers, phase: state.gameMode === 'interview' ? PHASE.INTERVIEW : PHASE.CLUE, currentPlayerIndex: 0, votes: {}, currentQuestion: nextQuestion, interviewRound: 1 };

        case 'IMPOSTOR_GUESS':
            const guessedWord = action.payload;
            if (guessedWord === state.secretWord) {
                // Impostor Guessed Correctly -> Steal Win
                return { ...state, phase: PHASE.GAME_OVER, winner: ROLE.IMPOSTOR };
            } else {
                // Wrong Guess -> Crew Wins (since they already voted Impostor out)
                return { ...state, phase: PHASE.GAME_OVER, winner: ROLE.CREW };
            }

        case 'RESET_GAME':
            console.log("Resetting game! robustly saving:", state.playerNames);
            return {
                ...initialState,
                playerCount: state.playerCount,
                impostorCount: state.impostorCount,
                playerNames: { ...state.playerNames },
                categories: [...state.categories],
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
