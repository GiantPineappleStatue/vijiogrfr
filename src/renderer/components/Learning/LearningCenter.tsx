import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTutorials, selectCurrentTutorial } from '../../features/learning/learningSlice';
import TutorialList from './TutorialList';
import TutorialPlayer from './TutorialPlayer';
import SampleTutorials from './sampleTutorials';
import './LearningCenter.css';

const LearningCenter: React.FC = () => {
  const dispatch = useDispatch();
  const currentTutorial = useSelector(selectCurrentTutorial);
  const [showTutorialPlayer, setShowTutorialPlayer] = useState(false);

  // Load sample tutorials on component mount
  useEffect(() => {
    dispatch(setTutorials(SampleTutorials));
  }, [dispatch]);

  // Handle starting a tutorial
  const handleStartTutorial = (tutorialId: string) => {
    setShowTutorialPlayer(true);
  };

  // Handle closing the tutorial player
  const handleCloseTutorialPlayer = () => {
    setShowTutorialPlayer(false);
  };

  return (
    <div className="learning-center">
      <div className="learning-header">
        <h1>Learning Center</h1>
        <p className="learning-subtitle">
          Learn Blender and After Effects with interactive step-by-step tutorials
        </p>
      </div>

      {showTutorialPlayer && currentTutorial ? (
        <div className="tutorial-player-container">
          <TutorialPlayer onClose={handleCloseTutorialPlayer} />
        </div>
      ) : (
        <TutorialList onStartTutorial={handleStartTutorial} />
      )}
    </div>
  );
};

export default LearningCenter;
