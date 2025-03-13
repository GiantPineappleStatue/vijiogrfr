import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';

// Tutorial step definition
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetAction: string;
  verificationMethod: 'screencapture' | 'userConfirmation';
  hints: string[];
  imageUrl?: string;
}

// Tutorial definition
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  softwareTarget: 'blender' | 'afterEffects' | 'both';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes: number;
  category: string;
  tags: string[];
  steps: TutorialStep[];
}

// User progress type
export interface UserProgress {
  completedTutorials: string[]; // IDs of completed tutorials
  currentTutorial: string | null; // ID of current tutorial
  currentStep: number; // Index of current step in tutorial
  completedSteps: Record<string, number[]>; // tutorialId -> array of completed step indices
  skillExperience: Record<string, number>; // skill name -> experience points
}

// Learning state
export interface LearningState {
  tutorials: Tutorial[];
  userProgress: UserProgress;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: LearningState = {
  tutorials: [],
  userProgress: {
    completedTutorials: [],
    currentTutorial: null,
    currentStep: 0,
    completedSteps: {},
    skillExperience: {},
  },
  isLoading: false,
  error: null,
};

// Learning slice
export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    // Set tutorials
    setTutorials: (state, action: PayloadAction<Tutorial[]>) => {
      state.tutorials = action.payload;
    },

    // Start a tutorial
    startTutorial: (state, action: PayloadAction<string>) => {
      state.userProgress.currentTutorial = action.payload;
      state.userProgress.currentStep = 0;

      // Initialize completed steps array if needed
      if (!state.userProgress.completedSteps[action.payload]) {
        state.userProgress.completedSteps[action.payload] = [];
      }
    },

    // Complete current step
    completeCurrentStep: (state) => {
      if (state.userProgress.currentTutorial) {
        const tutorialId = state.userProgress.currentTutorial;
        const currentStep = state.userProgress.currentStep;

        // Add to completed steps if not already there
        if (!state.userProgress.completedSteps[tutorialId].includes(currentStep)) {
          state.userProgress.completedSteps[tutorialId].push(currentStep);
        }

        // Find the tutorial
        const tutorial = state.tutorials.find(t => t.id === tutorialId);
        if (tutorial) {
          // Move to next step if available
          if (currentStep < tutorial.steps.length - 1) {
            state.userProgress.currentStep += 1;
          } else {
            // Tutorial completed
            if (!state.userProgress.completedTutorials.includes(tutorialId)) {
              state.userProgress.completedTutorials.push(tutorialId);
            }
            state.userProgress.currentTutorial = null;
            state.userProgress.currentStep = 0;
          }
        }
      }
    },

    // Navigate to specific step
    goToStep: (state, action: PayloadAction<number>) => {
      if (state.userProgress.currentTutorial) {
        const tutorial = state.tutorials.find(
          t => t.id === state.userProgress.currentTutorial
        );
        if (tutorial && action.payload >= 0 && action.payload < tutorial.steps.length) {
          state.userProgress.currentStep = action.payload;
        }
      }
    },

    // Add experience to skills
    addSkillExperience: (
      state,
      action: PayloadAction<{ skill: string; amount: number }>
    ) => {
      const { skill, amount } = action.payload;
      state.userProgress.skillExperience[skill] =
        (state.userProgress.skillExperience[skill] || 0) + amount;
    },

    // Reset user progress
    resetProgress: (state) => {
      state.userProgress = initialState.userProgress;
    },
  },
});

// Export actions
export const {
  setTutorials,
  startTutorial,
  completeCurrentStep,
  goToStep,
  addSkillExperience,
  resetProgress,
} = learningSlice.actions;

// Export selectors
export const selectTutorials = (state: RootState) => state.learning.tutorials;
export const selectUserProgress = (state: RootState) => state.learning.userProgress;
export const selectCurrentTutorial = (state: RootState) => {
  const currentId = state.learning.userProgress.currentTutorial;
  return currentId
    ? state.learning.tutorials.find(t => t.id === currentId)
    : null;
};
export const selectCurrentStep = (state: RootState) => {
  const tutorial = selectCurrentTutorial(state);
  const stepIndex = state.learning.userProgress.currentStep;
  return tutorial && stepIndex < tutorial.steps.length
    ? tutorial.steps[stepIndex]
    : null;
};

export default learningSlice.reducer;
