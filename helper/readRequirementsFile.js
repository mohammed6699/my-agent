import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
export async function readRequirementsFile(filePath) {
    try {
    const fileExtension = path.extname(filePath).toLowerCase();
    if (fileExtension  === '.pdf') {
        try {
            const buffer = await fs.readFile(filePath);
            const data = await PDFParse(buffer);
            return data.text;
        } catch (err) {
            console.error(chalk.red(`Failed to parse PDF ${filePath}:`), err);
            return null;
        }
    }
    return await fs.readFile(filePath, 'utf-8');
    }catch(err){
        console.log(chalk.red(err.message));
        return null;
    }
}
