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
        // Use A3 landscape for maximum width accommodation
        const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

        // Title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Training Schedule", 14, 20);

        // Schedule Table
        const head = [];
        // Header Row 1: Days (rowspan 2) + Batches (colspan sessions)
        const row1 = [
            {
                content: 'Days',
                rowSpan: 2,
                styles: { valign: 'middle', halign: 'center', fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', fontSize: 10 }
            }
        ];

        // Header Row 2: Sessions
        const row2 = [];

        batches.forEach(batch => {
            row1.push({
                content: batch,
                colSpan: sessions.length,
                styles: { halign: 'center', fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', fontSize: 9 }
            });
            sessions.forEach(session => {
                row2.push({
                    content: session,
                    styles: { halign: 'center', fillColor: [240, 253, 250], textColor: 50, fontSize: 8, fontStyle: 'bold' }
                });
            });
        });

        head.push(row1);
        head.push(row2);

        const body = days.map(day => {
            const row = [{ content: day, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], fontSize: 9 } }];
            batches.forEach(batch => {
                sessions.forEach(session => {
                    const cellData = pivot[day][batch][session];
                    let cellContent = '-';
                    if (cellData) {
                        cellContent = cellData.trainerName;
                        if (cellData.topic && cellData.topic !== '-') {
                            cellContent += `\n[${cellData.topic}]`;
                        }
                    }
                    row.push({
                        content: cellContent,
                        styles: { halign: 'center', valign: 'middle' }
                    });
                });
            });
            return row;
        });

        autoTable(doc, {
            startY: 30,
            head: head,
            body: body,
            theme: 'grid',
            margin: { top: 30, right: 10, bottom: 20, left: 10 },
            styles: {
                fontSize: 7, // Further reduced font size
                cellPadding: 1.5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                overflow: 'linebreak',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: 20,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 15 } // Reduced width for Days column
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index > 0) {
                    data.cell.styles.minCellWidth = 20; // Ensure minimum width for content columns
                }
            }
        });

        // Trainer References Table
        const finalY = doc.lastAutoTable.finalY || 30;
        const pageHeight = doc.internal.pageSize.height;

        // Check if we need a new page for references
        // If less than 50mm remaining, start new page
        if (pageHeight - finalY < 50) {
            doc.addPage();
            doc.text("Trainer References", 14, 20);
            autoTable(doc, {
                startY: 25,
                head: [['Trainer Name', 'Type', 'Topic']],
                body: trainers.map(t => [t.name, t.type, t.topic || '-']),
                theme: 'striped',
                margin: { left: 10, right: 10 },
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 'auto' }
                }
            });
        } else {
            doc.setFontSize(14);
            doc.text("Trainer References", 14, finalY + 15);

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Trainer Name', 'Type', 'Topic']],
                body: trainers.map(t => [t.name, t.type, t.topic || '-']),
                theme: 'striped',
                margin: { left: 10, right: 10 },
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 'auto' }
                }
            });
        }

        doc.save('training-schedule.pdf');
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
                            <th>Topic</th>
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
                                <td>{trainer.topic || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduleDisplay;
