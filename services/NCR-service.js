// handle read NCR file
import chalk from 'chalk';
import { readRequirementsFile } from '../helper/readRequirementsFile.js';
export async function LoadNCRfile() {
    const ccrFile = process.argv[2];
    if(!ccrFile){
        console.log(chalk.red('No NCR file provided.'));
        return null;
    }
    try {
        const ccrContent = await readRequirementsFile(ccrFile);
        return ccrContent;
    } catch (error) {
        console.log(chalk.red(`Error loading NCR file: ${error.message}`));
        return null;
    }
}