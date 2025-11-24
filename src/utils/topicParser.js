import * as XLSX from 'xlsx';

export const parseTextFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const topics = text.split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);
            resolve(topics);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

export const parseCSVFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const topics = text.split(/\r?\n/)
                .map(line => {
                    // Simple CSV parse: take first column, remove quotes if present
                    const firstCol = line.split(',')[0];
                    return firstCol ? firstCol.replace(/^"|"$/g, '').trim() : '';
                })
                .filter(topic => topic.length > 0);
            resolve(topics);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Extract first column from each row
                const topics = jsonData
                    .map(row => row[0])
                    .filter(cell => cell && typeof cell === 'string' && cell.trim().length > 0)
                    .map(cell => cell.trim());

                resolve(topics);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const extractTopics = async (files) => {
    const allTopics = [];

    for (const file of files) {
        let topics = [];
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            if (extension === 'txt') {
                topics = await parseTextFile(file);
            } else if (extension === 'csv') {
                topics = await parseCSVFile(file);
            } else if (['xlsx', 'xls'].includes(extension)) {
                topics = await parseExcelFile(file);
            }

            allTopics.push(...topics);
        } catch (error) {
            console.error(`Error parsing file ${file.name}:`, error);
            throw new Error(`Failed to parse ${file.name}`);
        }
    }

    // Remove duplicates
    return [...new Set(allTopics)];
};
