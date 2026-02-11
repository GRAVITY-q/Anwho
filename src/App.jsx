import React from 'react';
import { GameProvider, useGame, PHASE } from './context/GameContext';
import SetupScreen from './components/SetupScreen';
import RevealPhase from './components/RevealPhase';
import CluePhase from './components/CluePhase';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import ResultScreen from './components/ResultScreen'; // For game over or round result
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
      case PHASE.DISCUSSION:
        return <DiscussionPhase />;
      case PHASE.VOTE:
        return <VotingPhase />;
      case PHASE.RESULT:
      case PHASE.GAME_OVER:
        return <ResultScreen />;
      default:
        return <div className="center-content">Unknown Phase</div>;
    }
  };

  return (
    <div className="container">
      {renderPhase()}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
