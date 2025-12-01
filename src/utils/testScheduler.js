import { generateSchedule } from './scheduler.js';

const config = {
    trainingName: 'Test Training',
    trainingType: 'Mixed',
    batches: 3,
    days: 2,
    sessionsPerDay: 4
};

const trainers = [
    { id: 1, name: 'T1', type: 'Aptitude', topic: 'A1' },
    { id: 2, name: 'T2', type: 'Aptitude', topic: 'A2' },
    { id: 3, name: 'T3', type: 'Verbal', topic: 'V1' },
    { id: 4, name: 'T4', type: 'Logical', topic: 'L1' }
];

console.log("Generating schedule...");
const schedule = generateSchedule(config, trainers);

console.log(`Generated ${schedule.length} items.`);

let errors = 0;

// Group by batch
const batchSchedules = {};
schedule.forEach(item => {
    if (!batchSchedules[item.batch]) batchSchedules[item.batch] = [];
    batchSchedules[item.batch].push(item);
});

// Check consecutive types
Object.keys(batchSchedules).forEach(batch => {
    const items = batchSchedules[batch];
    // Sort by day and session to ensure correct order
    items.sort((a, b) => {
        const dayA = parseInt(a.day.replace(/\D/g, ''));
        const dayB = parseInt(b.day.replace(/\D/g, ''));
        if (dayA !== dayB) return dayA - dayB;
        const sessA = parseInt(a.session.replace(/\D/g, ''));
        const sessB = parseInt(b.session.replace(/\D/g, ''));
        return sessA - sessB;
    });

    for (let i = 0; i < items.length - 1; i++) {
        const current = items[i];
        const next = items[i + 1];

        if (current.trainerType === next.trainerType) {
            console.error(`[FAIL] Batch ${batch}: Consecutive ${current.trainerType} at ${current.day} ${current.session} and ${next.day} ${next.session}`);
            errors++;
        }
    }
});

if (errors === 0) {
    console.log("[PASS] No consecutive sessions of same type found.");
} else {
    console.log(`[FAIL] Found ${errors} violations.`);
}
