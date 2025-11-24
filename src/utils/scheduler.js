/**
 * Generates a training schedule based on the provided configuration and trainers.
 * 
 * @param {Object} config - Training configuration
 * @param {string} config.trainingName - Name of the training
 * @param {string} config.trainingType - 'Technical', 'Mixed', or 'Non-Technical'
 * @param {number} config.batches - Number of batches
 * @param {number} config.days - Number of training days
 * @param {number} config.sessionsPerDay - Number of sessions per day
 * @param {Array} trainers - List of trainer objects { id, name, type, topic }
 * @returns {Array} Generated schedule items { batch, day, session, trainerName, trainerType, topic }
 */
export const generateSchedule = (config, trainers) => {
  const { trainingType, batches, days, sessionsPerDay } = config;
  const schedule = [];

  if (!trainers || trainers.length === 0) {
    return [];
  }

  // Rule 1: Technical Training (only if technical trainers exist)
  const techTrainers = trainers.filter(t => t.type === 'Technical');

  if (trainingType === 'Technical' && techTrainers.length > 0) {
    for (let b = 1; b <= batches; b++) {
      const assignedTrainer = techTrainers[(b - 1) % techTrainers.length];

      for (let d = 1; d <= days; d++) {
        for (let s = 1; s <= sessionsPerDay; s++) {
          schedule.push({
            batch: `Batch ${b}`,
            day: `Day ${d}`,
            session: `Session ${s}`,
            trainerName: assignedTrainer.name,
            trainerType: assignedTrainer.type,
            topic: assignedTrainer.topic || '-'
          });
        }
      }
    }
  }
  // Rule 2: Mixed, Non-Technical, or Technical (fallback)
  else {
    // Rotational assignment
    // Ensure fair rotation across batches and sessions.
    // Formula: (DayIndex + SessionIndex + BatchIndex) % NumTrainers

    for (let d = 1; d <= days; d++) {
      for (let s = 1; s <= sessionsPerDay; s++) {
        for (let b = 1; b <= batches; b++) {
          // Calculate indices (0-based)
          const dayIdx = d - 1;
          const sessionIdx = s - 1;
          const batchIdx = b - 1;

          // Rotation logic:
          // Shift by day to rotate daily.
          // Shift by session to rotate within a day.
          // Shift by batch to ensure different batches have different trainers at the same time.
          const trainerIndex = (dayIdx + sessionIdx + batchIdx) % trainers.length;
          const trainer = trainers[trainerIndex];

          schedule.push({
            batch: `Batch ${b}`,
            day: `Day ${d}`,
            session: `Session ${s}`,
            trainerName: trainer.name,
            trainerType: trainer.type,
            topic: trainer.topic || '-'
          });
        }
      }
    }
  }

  return schedule;
};
