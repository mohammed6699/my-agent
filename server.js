import dotenv from 'dotenv';
dotenv.config();
import { executeTerminalCommands, generateFileTreeStructure, listFilesTool, readFileTool, writeFileContent } from './ai/schemas.js';
import { getBlueprintPrompt, SYSTEM_INSTRUCTION } from './ai/prompts.js';
import { createProjectSkeleton, listFiles, writeFileContentToDisk, readFile, getCurrentProjectPath, saveSession, loadSession, archiveCurrentSession } from './services/file-executer.js';
import { executeCommand } from './services/commandExecutor.js';
import chalk from 'chalk';
import ora from 'ora';   
import { buildMessageWithFileContext } from './services/extractFiles.js';
import boxen from 'boxen';
import { LoadNCRfile } from './services/NCR-service.js';
import { rl, sanitizeAssistantMessage, createChatCompletionWithFallback } from './services/aiClient.js'
import { loadPRDFromArgs, extractUserStories } from './services/PRD-service.js';

    
    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    const tools = [...generateFileTreeStructure, writeFileContent, listFilesTool, readFileTool, executeTerminalCommands];
    const availableFunctions = {
    generate_project_structure: (args) => createProjectSkeleton(args),
    write_file_content: (args) => writeFileContentToDisk(args),
    list_files: (args) => listFiles(args),
    read_file: (args) => readFile(args),
    execute_terminal_command: (args) => executeCommand(args),
};

async function callTool(toolCall){
    const fn = availableFunctions[toolCall.function.name];
    if(!fn){
        console.log(chalk.red(`error: no function registred for ${toolCall.function.name}`))
    };
    const args = JSON.parse(toolCall.function.arguments)
    try {
        return await fn(args)
    } catch (error) {
       const errorMessage = `Error running ${toolCall.function.name}: ${error.message}`;
       console.log(chalk.yellow(errorMessage));
       return errorMessage;
    }
}

async function runMyAgent(messages, maxIterations = 50){
   let iterationCount = 0;
    // handke toosl used
    while(true){
        iterationCount++
        if(iterationCount > maxIterations){
            return "Stopped: exceeded max iterations without finishing.";
        }
        //     const response = await groq.chat.completions.create({
        //     model: 'llama-3.3-70b-versatile',
        //     messages,
        //     tools,
        // })
        const response = await createChatCompletionWithFallback({
            messages,
            tools,
        })
        const responseMessage = response.choices[0].message;
        messages.push(sanitizeAssistantMessage(responseMessage));
        const finishReason = response.choices[0].finish_reason;
        if (finishReason !== 'tool_calls') {
            return responseMessage.content;
        }
        if (!Array.isArray(responseMessage.tool_calls) || responseMessage.tool_calls.length === 0) {
            console.log(chalk.red.bold("Model claimed tool_calls but none were present."));
            return responseMessage.content || "No response content available.";
            }
            for (const toolCall of responseMessage.tool_calls) {
                const result = await callTool(toolCall);
                console.log(chalk.green(`  -> ${toolCall.function.name}(${toolCall.function.arguments}) = ${result}`));
                messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
            }
    }

}
function parseUserStorySelection(input, stories) {
    if (input.trim().toLowerCase() === 'all') {
        return stories;
    }
    return input
        .split(',')
        .map(s => s.trim())
        .map(s => parseInt(s, 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= stories.length)
        .map(n => stories[n - 1]);
}
// handle pdr file work folow
async function handlePRDWorkFlow(messages){
    const prdContent = await loadPRDFromArgs();
    if(!prdContent) return false;
    const spinner = ora('Extracting user stories from PRD...').start();
    const userStories = await extractUserStories(prdContent);
    spinner.stop();
    if (!userStories) {
        console.log(chalk.red('Could not extract user stories — falling back to normal mode.'));
        return false;
    }
    
    // Print each story clearly — id, title, description, and its
    for (const story of userStories) {
        console.log(boxen(chalk.green.bold(story.title), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue',
        }));
        console.log(chalk.yellow(`  -> ${story.description}`));
        console.log(chalk.yellow(`  Acceptance Criteria:\n${story.acceptanceCriteria.map(c => `    - ${c}`).join('\n')}`));
    }
    // Ask the user something like: "Build all N stories? (yes/no)" using askQuestion  
    const input = await askQuestion(boxen(
          chalk.yellow(
            'Enter the number(s) of the stories you want to build (e.g., \"1,2,4\") or type \"all\" for all stories:'
          ),
          { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'yellow' }
        ));
        const orderedStories = parseUserStorySelection(input, userStories);
        if (!orderedStories || orderedStories.length === 0) {
        console.log(chalk.yellow('No valid stories selected — falling back to normal mode.'));
        return false;
        }
        // Print numbered list (reuse your existing display loop, just add index numbers)
    for (const [idx, story] of orderedStories.entries()) {
        console.log(chalk.cyan(`\nBuilding story ${idx + 1} of ${orderedStories.length}: ${story.title}`));
        const storyDetails = `Title: ${story.title}\nDescription: ${story.description}\nAcceptance Criteria:\n${story.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`;
        const storyPrompt = idx === 0
            ? getBlueprintPrompt(storyDetails)
            : `Implement this additional feature:\n${storyDetails}`;
        messages.push({ role: 'user', content: storyPrompt });
        const spinner = ora(`Building: ${story.title}`).start();
        const answer = await runMyAgent(messages);
        spinner.stop();
        await saveSession(messages, getCurrentProjectPath());
        console.log(chalk.magenta.bold('Agent:'), chalk.green(answer));
    }
    return true;
}
async function main() {
    const priorMessages = await loadSession();
    // Was a file explicitly provided THIS run? (not "is there an old session")
    const prdRequested = process.argv.includes('--prd');
    const ncrRequested = !!process.argv[2] && !prdRequested; // adjust to match however you detect NCR's positional arg
    let messages;
    if (prdRequested || ncrRequested) {
        await archiveCurrentSession(); // safely preserve old work, never silently lost
        messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }]; // always start fresh
    } else {
        messages = priorMessages.length > 0 ? priorMessages : [{ role: 'system', content: SYSTEM_INSTRUCTION }];
    }
    let isFirstTurn = messages.length <= 1 
    // check the ncr file
    const handledByPRD = prdRequested ? await handlePRDWorkFlow(messages) : false;
    const ncrContent = (!handledByPRD && ncrRequested) ? await LoadNCRfile() : null;
    if(ncrContent){
        const content = getBlueprintPrompt(ncrContent)
        messages.push({role: "user", content})
        isFirstTurn = false;
        const spinner = ora('Building project from NCR file...').start();
        const finalAnswer = await runMyAgent(messages);
        spinner.stop();
        await saveSession(messages, getCurrentProjectPath());
        console.log('\n' + chalk.magenta.bold('Agent:'), chalk.green(finalAnswer));
    }
    if (handledByPRD || ncrContent) {
        isFirstTurn = false;
    }
    while(true){
        const userInput = await askQuestion(boxen(chalk.green.bold('How can I help you today? '), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue',
        }));
        if (userInput.trim().toLowerCase() === 'exit') {
            // save session
            await saveSession(messages, getCurrentProjectPath());
            rl.close();
            process.exit(0);
        }
        if (!userInput.trim()) continue;
        const extractedContent = await buildMessageWithFileContext(userInput)
        const content = isFirstTurn ? getBlueprintPrompt(extractedContent) : extractedContent;
        messages.push({ role: 'user', content });
        isFirstTurn = false;
        const spinner = ora('Thinking...').start();
        const finalAnswer = await runMyAgent(messages);
        spinner.stop();
        await saveSession(messages, getCurrentProjectPath());
        console.log('\n' + chalk.magenta.bold('Agent:'), chalk.green(finalAnswer));
    } 
    rl.close();
}   

main()