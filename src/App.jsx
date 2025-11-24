import React, { useState, useEffect } from 'react';
import TrainingForm from './components/TrainingForm';
import TrainerManager from './components/TrainerManager';
import TopicUploader from './components/TopicUploader';
import ScheduleDisplay from './components/ScheduleDisplay';
import ExportControls from './components/ExportControls';
import { generateSchedule } from './utils/scheduler';
import { Calendar } from 'lucide-react';

function App() {
  const [trainingConfig, setTrainingConfig] = useState({
    trainingName: '',
    trainingType: 'Technical',
    batches: 1,
    days: 1,
    sessionsPerDay: 1
  });

  const [trainers, setTrainers] = useState([]);
  const [topics, setTopics] = useState({});
  const [schedule, setSchedule] = useState([]);

  const handleAddTrainer = (trainer) => {
    setTrainers([...trainers, trainer]);
  };

  const handleRemoveTrainer = (id) => {
    setTrainers(trainers.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (trainers.length > 0) {
      const generated = generateSchedule(trainingConfig, trainers);
      setSchedule(generated);
    } else {
      setSchedule([]);
    }
  }, [trainingConfig, trainers]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Calendar size={32} />
          <h1>Training Schedule Planner</h1>
        </div>
      </header>

      <main className="main-content">
        <div className="input-section">
          <TrainingForm config={trainingConfig} onChange={setTrainingConfig} />
          <TrainerManager trainers={trainers} onAdd={handleAddTrainer} onRemove={handleRemoveTrainer} topics={topics} />
        </div>

        <TopicUploader topics={topics} onTopicsUpdate={setTopics} />

        <div className="output-section">
          <ExportControls schedule={schedule} trainers={trainers} trainingName={trainingConfig.trainingName || 'Training'} />
          <ScheduleDisplay schedule={schedule} trainers={trainers} />
        </div>
      </main>
    </div>
  );
}

export default App;
