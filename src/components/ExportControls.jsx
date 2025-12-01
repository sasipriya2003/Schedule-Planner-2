import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileDown, FileSpreadsheet } from 'lucide-react';

const ExportControls = ({ schedule, trainers, trainingName }) => {
    if (!schedule || schedule.length === 0) return null;

    // Helper to pivot data for export
    const getExpandedMatrixData = () => {
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

        const sessions = [...new Set(schedule.map(s => s.session))].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const pivot = {};
        days.forEach(day => {
            pivot[day] = {};
            batches.forEach(batch => {
                pivot[day][batch] = {};
                sessions.forEach(session => {
                    pivot[day][batch][session] = '';
                });
            });
        });

        schedule.forEach(item => {
            if (pivot[item.day] && pivot[item.day][item.batch]) {
                pivot[item.day][item.batch][item.session] = item.trainerName;
            }
        });

        return { batches, days, sessions, pivot };
    };

    const handlePdfExport = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const { batches, days, sessions, pivot } = getExpandedMatrixData();

        const batchesPerPage = 3; // Reduced to 3 for better readability on A4 Landscape
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
                        row.push(pivot[day][batch][session] || '-');
                    });
                });
                return row;
            });

            // Prepare table headers for current chunk
            const headRow1 = [{ content: 'Days', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }];
            currentBatches.forEach(batch => {
                headRow1.push({ content: batch, colSpan: sessions.length, styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' } });
            });

            const headRow2 = [];
            currentBatches.forEach(() => {
                sessions.forEach(session => {
                    headRow2.push({ content: session, styles: { halign: 'center', fillColor: [240, 240, 240] } });
                });
            });

            doc.autoTable({
                head: [headRow1, headRow2],
                body: tableBody,
                startY: 25,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    halign: 'center',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200],
                    overflow: 'linebreak',
                    rowPageBreak: 'avoid'
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineWidth: 0.1,
                    lineColor: [150, 150, 150]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 25, halign: 'left', fillColor: [250, 250, 250] }, // Day column
                },
                margin: { top: 25 },
                theme: 'grid',
                pageBreak: 'auto',
                showHead: 'everyPage',
                didDrawPage: (data) => {
                    // Add Title on every page
                    let title = `${trainingName} Schedule`;
                    if (totalBatchChunks > 1) {
                        title += ` (Batches ${currentBatches[0]} - ${currentBatches[currentBatches.length - 1]})`;
                    }
                    doc.setFontSize(14);
                    doc.text(title, 14, 15);
                }
            });
        }

        // Trainer Reference Table
        doc.addPage();
        doc.setFontSize(14);
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

        doc.autoTable({
            columns: referenceColumns,
            body: referenceRows,
            startY: 20,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            theme: 'grid'
        });

        doc.save(`${trainingName}.pdf`);
    };

    const handleExcelExport = () => {
        const wb = XLSX.utils.book_new();
        const { batches, days, sessions, pivot } = getExpandedMatrixData();

        // Prepare Matrix Data for Excel
        // Row 1: Days, Batch 1, (empty * sessions-1), Batch 2...
        const headerRow1 = ["Days"];
        batches.forEach(batch => {
            headerRow1.push(batch);
            for (let i = 1; i < sessions.length; i++) {
                headerRow1.push(""); // Placeholder for merge
            }
        });

        // Row 2: "", Session 1, Session 2...
        const headerRow2 = [""];
        batches.forEach(() => {
            sessions.forEach(session => {
                headerRow2.push(session);
            });
        });

        const dataRows = days.map(day => {
            const row = [day];
            batches.forEach(batch => {
                sessions.forEach(session => {
                    row.push(pivot[day][batch][session] || '-');
                });
            });
            return row;
        });

        const wsData = [headerRow1, headerRow2, ...dataRows];
        const wsSchedule = XLSX.utils.aoa_to_sheet(wsData);

        // Merge "Days" cell (A1:A2)
        if (!wsSchedule['!merges']) wsSchedule['!merges'] = [];
        wsSchedule['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });

        // Merge Batch headers
        let colIndex = 1;
        batches.forEach(() => {
            wsSchedule['!merges'].push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + sessions.length - 1 } });
            colIndex += sessions.length;
        });

        XLSX.utils.book_append_sheet(wb, wsSchedule, "Schedule");

        // Reference Sheet
        const referenceData = trainers.map(t => ({
            "Trainer Name": t.name,
            Type: t.type,
            Topic: t.isMultiTopic
                ? `${t.selectedTopics.join(', ')} (Rotates every ${t.switchAfterDays} day${t.switchAfterDays > 1 ? 's' : ''})`
                : (t.topic || '-')
        }));
        const wsReference = XLSX.utils.json_to_sheet(referenceData);
        XLSX.utils.book_append_sheet(wb, wsReference, "Trainer Reference");

        XLSX.writeFile(wb, `${trainingName}.xlsx`);
    };

    return (
        <div className="export-controls">
            <button onClick={handleExcelExport} className="btn btn-success">
                <FileSpreadsheet size={18} /> Download Excel
            </button>
        </div>
    );
};

export default ExportControls;
