// Removed unused Studente import

/**
 * Parses a CSV string that includes a header row.
 * This parser handles fields enclosed in double quotes that may contain commas.
 * @param csvText The raw string content of the CSV file.
 * @returns An object containing the headers and an array of data objects.
 */
export const parseCSVWithHeaders = (csvText: string): { headers: string[], data: Record<string, string>[] } => {
    // Normalize line endings and split
    const lines = csvText.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 1) {
        return { headers: [], data: [] };
    }

    const parseCsvRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                // Handle escaped quotes ("")
                if (inQuotes && row[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if ((char === ',' || char === ';') && !inQuotes) { 
                // Support both comma and semicolon as separators
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Parse header
    const headers = parseCsvRow(lines[0]);
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const rowString = lines[i];
        const values = parseCsvRow(rowString);
        
        // Basic validation: ensure row has some content
        if(values.length === 0 || (values.length === 1 && !values[0])) continue;

        const entry: Record<string, string> = {};
        // Map values to headers. If values are missing, fill with empty string.
        headers.forEach((header, index) => {
            entry[header] = values[index] || '';
        });
        data.push(entry);
    }

    return { headers, data };
};

