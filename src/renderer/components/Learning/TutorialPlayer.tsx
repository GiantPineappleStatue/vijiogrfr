import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentTutorial,
  selectCurrentStep,
  selectUserProgress,
  completeCurrentStep,
  goToStep
} from '../../features/learning/learningSlice';
import './TutorialPlayer.css';

interface TutorialPlayerProps {
  onClose: () => void;
}

const TutorialPlayer: React.FC<TutorialPlayerProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentTutorial = useSelector(selectCurrentTutorial);
  const currentStep = useSelector(selectCurrentStep);
  const userProgress = useSelector(selectUserProgress);

  const [showHint, setShowHint] = useState(false);
  const [userConfirmation, setUserConfirmation] = useState(false);

  // If no tutorial is active, show empty state
  if (!currentTutorial || !currentStep) {
    return (
      <div className="tutorial-player tutorial-empty">
        <h2>No Active Tutorial</h2>
        <p>Select a tutorial from the Learning Center to begin.</p>
        <button onClick={onClose} className="tutorial-close-btn">
          Close
        </button>
      </div>
    );
  }

  // Calculate progress percentage
  const totalSteps = currentTutorial.steps.length;
  const currentStepIndex = userProgress.currentStep;
  const progressPercent = Math.round((currentStepIndex / totalSteps) * 100);

  // Get completed steps for current tutorial
  const completedSteps = userProgress.completedSteps[currentTutorial.id] || [];

  // Handle step completion
  const handleCompleteStep = () => {
    if (currentStep.verificationMethod === 'userConfirmation') {
      if (userConfirmation) {
        dispatch(completeCurrentStep());
        setUserConfirmation(false);
        setShowHint(false);
      }
    } else {
      // For screencapture verification, we would integrate with the AI capabilities
      // to verify the step has been completed correctly
      console.log('Screen capture verification would happen here');
      dispatch(completeCurrentStep());
      setShowHint(false);
    }
  };

  // Navigate to specific step
  const handleGoToStep = (index: number) => {
    dispatch(goToStep(index));
    setShowHint(false);
    setUserConfirmation(false);
  };

  return (
    <div className="tutorial-player">
      <div className="tutorial-header">
        <h2>{currentTutorial.title}</h2>
        <div className="tutorial-difficulty">
          Level: {currentTutorial.difficulty}
        </div>
        <button onClick={onClose} className="tutorial-close-btn">
          Close
        </button>
      </div>

      <div className="tutorial-progress-bar">
        <div
          className="tutorial-progress-fill"
          style={{ width: `${progressPercent}%` }}
        ></div>
        <div className="tutorial-progress-text">
          Step {currentStepIndex + 1} of {totalSteps}
        </div>
      </div>

      <div className="tutorial-step-content">
        <h3>{currentStep.title}</h3>
        <p className="tutorial-step-description">{currentStep.description}</p>

        {currentStep.imageUrl && (
          <div className="tutorial-step-image">
            <img
              src={currentStep.imageUrl}
              alt={`Visualization for ${currentStep.title}`}
            />
          </div>
        )}

        <div className="tutorial-hint-section">
          {showHint ? (
            <div className="tutorial-hint">
              <h4>Hint:</h4>
              <ul>
                {currentStep.hints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
              <button onClick={() => setShowHint(false)}>Hide Hint</button>
            </div>
          ) : (
            <button onClick={() => setShowHint(true)} className="tutorial-hint-btn">
              Show Hint
            </button>
          )}
        </div>

        {currentStep.verificationMethod === 'userConfirmation' && (
          <div className="tutorial-verification">
            <label className="tutorial-confirm-checkbox">
              <input
                type="checkbox"
                checked={userConfirmation}
                onChange={(e) => setUserConfirmation(e.target.checked)}
              />
              I have completed this step
            </label>
          </div>
        )}
      </div>

      <div className="tutorial-navigation">
        <button
          onClick={() => handleGoToStep(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          className="tutorial-nav-btn"
        >
          Previous
        </button>
        <button
          onClick={handleCompleteStep}
          disabled={currentStep.verificationMethod === 'userConfirmation' && !userConfirmation}
          className="tutorial-complete-btn"
        >
          Complete & Continue
        </button>
      </div>

      <div className="tutorial-steps-overview">
        {currentTutorial.steps.map((step, index) => (
          <div
            key={step.id}
            className={`tutorial-step-indicator ${
              index === currentStepIndex ? 'current' : ''
            } ${completedSteps.includes(index) ? 'completed' : ''}`}
            onClick={() => handleGoToStep(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorialPlayer;
