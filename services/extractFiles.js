// manage the AI to handle spevific file using @ + file path
import fs from 'node:fs/promises';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORKSPACE_ROOT } from '../config.js';
function extractFileMentions(input) {
    const pattern = /@(\S+)/g;
    const matchs = [...input.matchAll(pattern)];
    return matchs.map(m => m[1])
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// read each file content
export async function buildMessageWithFileContext(userInput) {
    const mentions = extractFileMentions(userInput);
    let augmented = userInput;

    // const __dirname = path.dirname(fileURLToPath(import.meta.url));
    for (const mention of mentions) {
        const pattern = new RegExp(escapeRegExp(`@${mention}`), 'g');
        const absPath = path.resolve(WORKSPACE_ROOT, mention);
        try {
            const content = await fs.readFile(absPath, 'utf-8');
            augmented = augmented.replace(pattern, `\n--- FILE: ${mention} ---\n${content}\n--- END OF FILE: ${mention} ---\n`);
        } catch (error) {
            console.log(chalk.yellow(`Warning: could not read ${mention}: ${error.message}`));
            augmented = augmented.replace(pattern,
                `[ERROR: The file "${mention}" could not be found (${error.message}). ` +
                `Do NOT create a new project or generate a file with this name as a substitute. ` +
                `Simply tell the user this specific file path was not found and ask them to check the path or confirm it exists.]`
            );
        }
    }
    return augmented
}
