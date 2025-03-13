import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectTutorials,
  selectUserProgress,
  startTutorial,
  Tutorial
} from '../../features/learning/learningSlice';
import './TutorialList.css';

// Filter options
type FilterOption = 'all' | 'blender' | 'afterEffects' | 'inProgress' | 'completed';
type SortOption = 'recommended' | 'newest' | 'alphabetical' | 'difficulty';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface TutorialListProps {
  onStartTutorial: (tutorialId: string) => void;
}

const TutorialList: React.FC<TutorialListProps> = ({ onStartTutorial }) => {
  const dispatch = useDispatch();
  const tutorials = useSelector(selectTutorials);
  const userProgress = useSelector(selectUserProgress);

  // State for filters
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters to tutorials
  const filteredTutorials = tutorials.filter((tutorial: Tutorial) => {
    // Software filter
    if (filter === 'blender' && tutorial.softwareTarget !== 'blender' && tutorial.softwareTarget !== 'both') {
      return false;
    }
    if (filter === 'afterEffects' && tutorial.softwareTarget !== 'afterEffects' && tutorial.softwareTarget !== 'both') {
      return false;
    }

    // Progress filter
    if (filter === 'inProgress') {
      const tutorialSteps = userProgress.completedSteps[tutorial.id] || [];
      const isTutorialStarted = tutorialSteps.length > 0;
      const isTutorialCompleted = userProgress.completedTutorials.includes(tutorial.id);

      return isTutorialStarted && !isTutorialCompleted;
    }

    if (filter === 'completed') {
      return userProgress.completedTutorials.includes(tutorial.id);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all' && tutorial.difficulty !== difficultyFilter) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tutorial.title.toLowerCase().includes(query) ||
        tutorial.description.toLowerCase().includes(query) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Sort tutorials
  const sortedTutorials = [...filteredTutorials].sort((a: Tutorial, b: Tutorial) => {
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }

    if (sortBy === 'difficulty') {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    }

    if (sortBy === 'newest') {
      // This would use a date property that's not in our model yet
      // For now, just use alphabetical as a fallback
      return a.title.localeCompare(b.title);
    }

    if (sortBy === 'recommended') {
      // For recommendation sorting, we could implement a more advanced algorithm
      // based on user progress, skills, etc.
      // For now, prioritize 'in progress' tutorials, then sort by difficulty
      const aInProgress = userProgress.completedSteps[a.id]?.length > 0;
      const bInProgress = userProgress.completedSteps[b.id]?.length > 0;

      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;

      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    }

    return 0;
  });

  // Handle starting a tutorial
  const handleStartTutorial = (tutorialId: string) => {
    dispatch(startTutorial(tutorialId));
    onStartTutorial(tutorialId);
  };

  // Calculate tutorial progress
  const getTutorialProgress = (tutorialId: string): number => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (!tutorial) return 0;

    const completedSteps = userProgress.completedSteps[tutorialId] || [];
    return Math.round((completedSteps.length / tutorial.steps.length) * 100);
  };

  return (
    <div className="tutorial-list">
      <div className="tutorial-search-filters">
        <input
          type="text"
          placeholder="Search tutorials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tutorial-search-input"
        />

        <div className="tutorial-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="tutorial-filter-select"
          >
            <option value="all">All Tutorials</option>
            <option value="blender">Blender</option>
            <option value="afterEffects">After Effects</option>
            <option value="inProgress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
            className="tutorial-filter-select"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="tutorial-filter-select"
          >
            <option value="recommended">Recommended</option>
            <option value="alphabetical">A-Z</option>
            <option value="difficulty">By Difficulty</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {sortedTutorials.length === 0 ? (
        <div className="tutorial-empty-state">
          <h3>No tutorials found</h3>
          <p>Try changing your filters or search query</p>
        </div>
      ) : (
        <div className="tutorials-grid">
          {sortedTutorials.map((tutorial: Tutorial) => {
            const isCompleted = userProgress.completedTutorials.includes(tutorial.id);
            const progress = getTutorialProgress(tutorial.id);
            const isInProgress = progress > 0 && !isCompleted;

            return (
              <div
                key={tutorial.id}
                className={`tutorial-card ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''}`}
              >
                <div className="tutorial-card-header">
                  <span className={`tutorial-software ${tutorial.softwareTarget}`}>
                    {tutorial.softwareTarget === 'both'
                      ? 'Blender & After Effects'
                      : tutorial.softwareTarget === 'blender'
                        ? 'Blender'
                        : 'After Effects'}
                  </span>
                  <span className={`tutorial-difficulty ${tutorial.difficulty}`}>
                    {tutorial.difficulty}
                  </span>
                </div>

                <h3 className="tutorial-title">{tutorial.title}</h3>
                <p className="tutorial-description">{tutorial.description}</p>

                <div className="tutorial-meta">
                  <span>{tutorial.steps.length} steps</span>
                  <span>{tutorial.estimatedTimeMinutes} min</span>
                </div>

                {(isInProgress || isCompleted) && (
                  <div className="tutorial-progress">
                    <div className="tutorial-progress-bar">
                      <div
                        className="tutorial-progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="tutorial-progress-text">
                      {isCompleted ? 'Completed' : `${progress}% complete`}
                    </span>
                  </div>
                )}

                <div className="tutorial-tags">
                  {tutorial.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="tutorial-tag">{tag}</span>
                  ))}
                </div>

                <button
                  onClick={() => handleStartTutorial(tutorial.id)}
                  className="tutorial-start-btn"
                >
                  {isCompleted
                    ? 'Review Tutorial'
                    : isInProgress
                      ? 'Continue'
                      : 'Start Tutorial'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TutorialList;
