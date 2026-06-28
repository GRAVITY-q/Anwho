import React from 'react';
import { GameProvider, useGame, PHASE } from './context/GameContext';
import SetupScreen from './components/SetupScreen';
import RevealPhase from './components/RevealPhase';
import CluePhase from './components/CluePhase';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import ResultScreen from './components/ResultScreen'; // For game over or round result
import InterviewPhase from './components/InterviewPhase';
import ImpostorGuessPhase from './components/ImpostorGuessPhase';
import { db } from "./lib/firebase";
import { Analytics } from "@vercel/analytics/react"
import DarkVeil from './components/DarkVeil';
import './index.css';

function GameContainer() {
  const { state } = useGame();

  // Simple router based on phase
  const renderPhase = () => {
    switch (state.phase) {
      case PHASE.SETUP:
        return <SetupScreen />;
      case PHASE.REVEAL:
        return <RevealPhase />;
      case PHASE.CLUE:
        return <CluePhase />;
      case PHASE.INTERVIEW:
        return <InterviewPhase />;
      case PHASE.DISCUSSION:
        return <DiscussionPhase />;
      case PHASE.VOTE:
        return <VotingPhase />;
      case PHASE.RESULT:
      case PHASE.GAME_OVER:
        return <ResultScreen />;
      case PHASE.IMPOSTOR_GUESS:
        return <ImpostorGuessPhase />;
      default:
        return <div className="center-content">Unknown Phase</div>;
    }
  };

  // Determine if the current phase should be scrollable
  const isScrollable = state.phase === PHASE.SETUP || state.phase === PHASE.RESULT || state.phase === PHASE.GAME_OVER;

  return (
    <div className={`container ${!isScrollable ? 'scroll-lock' : ''}`}>
      {renderPhase()}
    </div>
  );
}

function App() {
  console.log("🔥 Firestore connected:", db);

  return (
    <GameProvider>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', opacity: 0.25 }}>
        <DarkVeil speed={0.15} noiseIntensity={0.015} warpAmount={0.15} />
      </div>
      <GameContainer />
      <Analytics />
    </GameProvider>
  );
}

export default App;
