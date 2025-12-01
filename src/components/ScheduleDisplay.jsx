import React, { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const ScheduleDisplay = ({ schedule, trainers }) => {
    const matrixData = useMemo(() => {
        if (!schedule || schedule.length === 0) return null;

        // Extract unique batches and days
        const batches = [...new Set(schedule.map(s => s.batch))].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const days = [...new Set(schedule.map(s => s.day))].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Extract unique sessions per batch (assuming same sessions for all batches/days for now)
        // We need to know max sessions to determine colSpan
        const sessions = [...new Set(schedule.map(s => s.session))].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Pivot data: Map<Day, Map<Batch, Map<Session, ScheduleItem>>>
        const pivot = {};
        days.forEach(day => {
            pivot[day] = {};
            batches.forEach(batch => {
                pivot[day][batch] = {};
                sessions.forEach(session => {
                    pivot[day][batch][session] = null;
                });
            });
        });

        schedule.forEach(item => {
            if (pivot[item.day] && pivot[item.day][item.batch]) {
                pivot[item.day][item.batch][item.session] = {
                    trainerName: item.trainerName,
                    topic: item.topic
                };
            }
        });

        return { batches, days, sessions, pivot };
    }, [schedule]);

    if (!schedule || schedule.length === 0 || !matrixData) {
        return null;
    }

    const { batches, days, sessions, pivot } = matrixData;

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const { batches, days, sessions, pivot } = matrixData;
        const currentTrainingName = "Training Schedule"; // Default title

        const batchesPerPage = 3; // 3 batches per page for readability
        const totalBatchChunks = Math.ceil(batches.length / batchesPerPage);

        for (let chunkIndex = 0; chunkIndex < totalBatchChunks; chunkIndex++) {
            if (chunkIndex > 0) {
                doc.addPage();
            }

            const startBatch = chunkIndex * batchesPerPage;
            const endBatch = Math.min(startBatch + batchesPerPage, batches.length);
            const currentBatches = batches.slice(startBatch, endBatch);

            // Prepare table body for current chunk
            const tableBody = days.map(day => {
                const row = [day];
                currentBatches.forEach(batch => {
                    sessions.forEach(session => {
                        const cellData = pivot[day][batch][session];
                        let cellContent = '-';
                        if (cellData) {
                            cellContent = cellData.trainerName;
                            if (cellData.topic && cellData.topic !== '-') {
                                cellContent += `\n[${cellData.topic}]`;
                            }
                        }
                        row.push(cellContent);
                    });
                });
                return row;
            });

            // Prepare table headers for current chunk
            const headRow1 = [{ content: 'Days', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' } }];
            currentBatches.forEach(batch => {
                headRow1.push({
                    content: batch,
                    colSpan: sessions.length,
                    styles: { halign: 'center', fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' }
                });
            });

            const headRow2 = [];
            currentBatches.forEach(() => {
                sessions.forEach(session => {
                    headRow2.push({
                        content: session,
                        styles: { halign: 'center', fillColor: [240, 253, 250], textColor: 50, fontSize: 12, fontStyle: 'bold' }
                    });
                });
            });

            autoTable(doc, {
                head: [headRow1, headRow2],
                body: tableBody,
                startY: 25,
                styles: {
                    fontSize: 12,
                    cellPadding: 2,
                    halign: 'center',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200],
                    overflow: 'linebreak',
                    rowPageBreak: 'avoid',
                    valign: 'middle'
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineWidth: 0.1,
                    lineColor: [150, 150, 150]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 20, halign: 'center', fillColor: [241, 245, 249] }, // Day column
                },
                margin: { top: 25 },
                theme: 'grid',
                pageBreak: 'auto',
                showHead: 'everyPage',
                didDrawPage: (data) => {
                    // Add Title on every page
                    let title = currentTrainingName;
                    if (totalBatchChunks > 1) {
                        title += ` (Batches ${currentBatches[0]} - ${currentBatches[currentBatches.length - 1]})`;
                    }
                    doc.setFontSize(18);
                    doc.setTextColor(40, 40, 40);
                    doc.text(title, 14, 15);
                }
            });
        }

        // Trainer Reference Table
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text("Trainer Reference", 14, 15);

        const referenceColumns = [
            { header: "Trainer Name", dataKey: "name" },
            { header: "Type", dataKey: "type" },
            { header: "Topic", dataKey: "topic" }
        ];

        const referenceRows = trainers.map(t => ({
            name: t.name,
            type: t.type,
            topic: t.isMultiTopic
                ? `${t.selectedTopics.join(', ')} (Rotates every ${t.switchAfterDays} day${t.switchAfterDays > 1 ? 's' : ''})`
                : (t.topic || '-')
        }));

        autoTable(doc, {
            columns: referenceColumns,
            body: referenceRows,
            startY: 20,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [52, 73, 94],
                textColor: 255,
                fontStyle: 'bold'
            },
            theme: 'striped'
        });

        doc.save("Schedule.pdf");
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Generated Schedule</h2>
                <button onClick={handleDownloadPDF} className="btn btn-primary">
                    <Download size={18} style={{ marginRight: '0.5rem' }} />
                    Download PDF
                </button>
            </div>

            <div className="table-container">
                <h3 className="subsection-title">Schedule</h3>
                <table className="schedule-table matrix-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="matrix-header-corner">Days</th>
                            {batches.map(batch => (
                                <th key={batch} colSpan={sessions.length} className="batch-header">
                                    {batch}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {batches.map(batch => (
                                sessions.map(session => (
                                    <th key={`${batch}-${session}`} className="session-header">
                                        {session}
                                    </th>
                                ))
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => (
                            <tr key={day}>
                                <td className="matrix-day-cell">{day}</td>
                                {batches.map(batch => (
                                    sessions.map(session => {
                                        const cellData = pivot[day][batch][session];
                                        return (
                                            <td key={`${day}-${batch}-${session}`} className="matrix-cell-simple">
                                                {cellData ? (
                                                    <div className="schedule-cell-content">
                                                        <div className="trainer-name">{cellData.trainerName}</div>
                                                        {cellData.topic && cellData.topic !== '-' && (
                                                            <div className="topic-name">{cellData.topic}</div>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        );
                                    })
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-container" style={{ marginTop: '2rem' }}>
                <h3 className="subsection-title">Trainer Reference</h3>
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>Trainer Name</th>
                            <th>Type</th>
                            <th>Topics</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trainers.map((trainer, index) => (
                            <tr key={index}>
                                <td>{trainer.name}</td>
                                <td>
                                    <span className={`badge badge-${trainer.type.toLowerCase().replace(' ', '-')}`}>
                                        {trainer.type}
                                    </span>
                                </td>
                                <td>
                                    {trainer.isMultiTopic ? (
                                        <div>
                                            <div style={{ marginBottom: '0.25rem' }}>
                                                {trainer.selectedTopics.join(', ')}
                                            </div>
                                            <small style={{ color: 'var(--text-secondary)' }}>
                                                Rotates every {trainer.switchAfterDays} day{trainer.switchAfterDays > 1 ? 's' : ''}
                                            </small>
                                        </div>
                                    ) : (
                                        trainer.topic || '-'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduleDisplay;
