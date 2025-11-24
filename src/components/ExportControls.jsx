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
        doc.text(`${trainingName} Schedule`, 14, 15);

        const { batches, days, sessions, pivot } = getExpandedMatrixData();

        // Prepare table body
        const tableBody = days.map(day => {
            const row = [day];
            batches.forEach(batch => {
                sessions.forEach(session => {
                    row.push(pivot[day][batch][session] || '-');
                });
            });
            return row;
        });

        // Prepare table headers
        // Row 1: Days, Batch 1 (span), Batch 2 (span)...
        const headRow1 = [{ content: 'Days', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }];
        batches.forEach(batch => {
            headRow1.push({ content: batch, colSpan: sessions.length, styles: { halign: 'center', fillColor: [220, 220, 220] } });
        });

        // Row 2: Session 1, Session 2... repeated
        const headRow2 = [];
        batches.forEach(() => {
            sessions.forEach(session => {
                headRow2.push(session);
            });
        });

        doc.autoTable({
            head: [headRow1, headRow2],
            body: tableBody,
            startY: 20,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                halign: 'center'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 20, halign: 'left' }, // Day column
            }
        });

        // Trainer Reference Table
        const finalY = doc.lastAutoTable.finalY || 20;
        doc.text("Trainer Reference", 14, finalY + 15);

        const referenceColumns = ["Trainer Name", "Type", "Topic"];
        const referenceRows = trainers.map(t => [
            t.name,
            t.type,
            t.topic || '-'
        ]);

        doc.autoTable({
            head: [referenceColumns],
            body: referenceRows,
            startY: finalY + 20,
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
        const referenceData = trainers.map(({ name, type, topic }) => ({
            "Trainer Name": name,
            Type: type,
            Topic: topic || '-'
        }));
        const wsReference = XLSX.utils.json_to_sheet(referenceData);
        XLSX.utils.book_append_sheet(wb, wsReference, "Trainer Reference");

        XLSX.writeFile(wb, `${trainingName}.xlsx`);
    };

    return (
        <div className="export-controls">
            <button onClick={handlePdfExport} className="btn btn-danger">
                <FileDown size={18} /> Download PDF
            </button>
            <button onClick={handleExcelExport} className="btn btn-success">
                <FileSpreadsheet size={18} /> Download Excel
            </button>
        </div>
    );
};

export default ExportControls;
