import chalk from 'chalk';
import { createChatCompletionWithFallback } from './aiClient.js';
import { extractUserStoriesTool } from '../ai/schemas.js';
import { readRequirementsFile } from '../helper/readRequirementsFile.js';
async function getFlagValue(flagName){
    const index = process.argv.indexOf(flagName);
    if(index === -1){
        return null
    }
    return process.argv[index + 1];
}
export async function loadPRDFromArgs(){
    const prdPath = await getFlagValue('--prd');
    if(!prdPath){
        console.log(chalk.red('No PRD file provided.'));
        return null;
    }
    try {
        const prdContent = await readRequirementsFile(prdPath);
        return prdContent;
    } catch (error) {
        console.log(chalk.red(`Error loading PRD file: ${error.message}`));
        return null;
    }
}

export async function extractUserStories(prdContent){
    const messages = [
        {
            role: 'user',
            content: `Analyze this PRD and extract every distinct user story or feature. ` +
                `Be thorough — don't merge unrelated features into one story.\n\n"""\n${prdContent}\n"""`,
        },
    ];
    const response = await createChatCompletionWithFallback({
        messages,
        tools: [extractUserStoriesTool],
        tool_choice: 'required',
    });
    const toolCalls = response.choices[0].message.tool_calls;
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        console.log(chalk.red('Model did not return structured user stories.'));
        return null;
    }
    const argumentsJson = toolCalls[0].function.arguments;
    const { stories } = JSON.parse(argumentsJson);
    if (!stories || stories.length === 0) {
        console.log(chalk.red('No user stories found.'));
        return null;
    }
    return stories;
}
