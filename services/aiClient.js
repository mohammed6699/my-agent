import chalk from 'chalk';
import readline from 'node:readline';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();
export const groq = new Groq({apiKey: process.env.GROQ_API_KEY})

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
export const model_list = [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-safeguard-20b',
    
];
export function sanitizeAssistantMessage(msg) {
    const clean = { role: msg.role, content: msg.content ?? null };
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        clean.tool_calls = msg.tool_calls;
    }
    return clean;
}
// main CLI agent functions
export async function createChatCompletionWithFallback(params) {
    let lastError = null;
    for (const model of model_list) {
        try {
            const res = await groq.chat.completions.create({ ...params, model });
            return res;
        } catch (error) {
            lastError = error;
            console.log(chalk.yellow(`Model ${model} failed: ${error.message}, trying next...`));
        }
    }
    throw new Error(`All models failed. Last error: ${lastError.message}`);
}