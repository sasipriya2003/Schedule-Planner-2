import { generateSchedule } from './src/utils/scheduler.js';

const config = {
    trainingName: 'Test Training',
    trainingType: 'Technical',
    batches: 1,
    days: 15,
    sessionsPerDay: 1
};

const trainers = [
    {
        id: 1,
        name: 'Trainer A',
        type: 'Technical',
        isMultiTopic: true,
        selectedTopics: [
            { name: 'Topic 1', days: 2 },
            { name: 'Topic 2', days: 4 },
            { name: 'Topic 3', days: 1 },
            { name: 'Topic 1', days: 3 }
        ]
    }
];

const schedule = generateSchedule(config, trainers);

console.log('Day | Topic');
console.log('----|------');
schedule.forEach(item => {
    console.log(`${item.day} | ${item.topic}`);
});
