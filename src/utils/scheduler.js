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

  // Helper to get topic based on rotation
  const getTrainerTopic = (trainer, day) => {
    if (!trainer.isMultiTopic) return trainer.topic || '-';
    if (!trainer.selectedTopics || trainer.selectedTopics.length === 0) return '-';

    // Calculate total cycle duration
    const cycleDuration = trainer.selectedTopics.reduce((sum, t) => sum + (t.days || 1), 0);
    if (cycleDuration === 0) return '-';

    // Find position in cycle
    let dayInCycle = (day - 1) % cycleDuration;

    // Find which topic covers this day
    for (const topicObj of trainer.selectedTopics) {
      const duration = topicObj.days || 1;
      if (dayInCycle < duration) {
        return topicObj.name;
      }
      dayInCycle -= duration;
    }
    return '-';
  };

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
            topic: getTrainerTopic(assignedTrainer, d)
          });
        }
      }
    }
  }
  // Rule 2: Mixed, Non-Technical, or Technical (fallback)
  else {
    // Smart assignment logic
    // Track usage to ensure fair distribution
    const trainerUsage = {};
    trainers.forEach(t => trainerUsage[t.id] = 0);

    // Track the last training type for each batch to avoid consecutive same types
    const lastTypeForBatch = {}; // { batchId: 'Type' }

    for (let d = 1; d <= days; d++) {
      for (let s = 1; s <= sessionsPerDay; s++) {
        // Track assigned trainers for this specific time slot (day + session) across all batches
        // to avoid double booking a trainer in the same slot
        const assignedTrainersInSlot = new Set();

        for (let b = 1; b <= batches; b++) {
          const batchId = `Batch ${b}`;
          const prevType = lastTypeForBatch[batchId];

          // 1. Identify valid candidates (not assigned in this slot)
          const availableTrainers = trainers.filter(t => !assignedTrainersInSlot.has(t.id));

          // 2. Filter for preferred candidates (different type than previous session for this batch)
          let candidates = availableTrainers.filter(t => t.type !== prevType);

          // Fallback 1: If no candidates with different type, use any available trainer
          if (candidates.length === 0) {
            candidates = availableTrainers;
          }

          // Fallback 2: If no available trainers at all (e.g. more batches than trainers), 
          // must reuse a trainer (double booking) - though ideally shouldn't happen if validated.
          // In this case, try to at least respect the type constraint from the full pool.
          if (candidates.length === 0) {
            candidates = trainers.filter(t => t.type !== prevType);
            if (candidates.length === 0) candidates = trainers;
          }

          // 3. Select the best candidate based on usage count (fairness)
          // Sort by usage count ascending
          candidates.sort((a, b) => trainerUsage[a.id] - trainerUsage[b.id]);

          // Pick the one with least usage
          const selectedTrainer = candidates[0];

          // 4. Assign
          schedule.push({
            batch: batchId,
            day: `Day ${d}`,
            session: `Session ${s}`,
            trainerName: selectedTrainer.name,
            trainerType: selectedTrainer.type,
            topic: getTrainerTopic(selectedTrainer, d)
          });

          // 5. Update tracking
          assignedTrainersInSlot.add(selectedTrainer.id);
          trainerUsage[selectedTrainer.id]++;
          lastTypeForBatch[batchId] = selectedTrainer.type;
        }
      }
    }
  }

  return schedule;
};
