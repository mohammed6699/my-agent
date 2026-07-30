// --- Tool 1: skeleton only, NO code anywhere in this schema ---
// This tool's entire job is to plan folder/file PATHS. Nothing else.
// Removing `code` from every level means there's no deep nested string
// content for the model to lose track of — just short path strings.
export const generateFileTreeStructure = [
    {
        type: 'function',
        function: {
            name: 'generate_project_structure',
            description:
                'Creates the empty skeleton of a project: its directories and file paths only, with NO code content. ' +
                'Call this FIRST, before writing any code. After this succeeds, you will call write_file_content ' +
                'once for EACH file listed here, to actually write that file\'s real code. ' +
                'Do not include package.json, node_modules, dist, build, or .git as directories here — ' +
                'package.json should be listed as a normal file path and its content written later via write_file_content, ' +
                'and node_modules/dist/build/.git should never be created by you at all.',
            parameters: {
                type: 'object',
                properties: {
                    projectName: {
                        type: 'string',
                        description: 'The kebab-case name of the project\'s root folder, e.g. "my-auth-service".',
                    },
                    directories: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Flat list of every directory path to create, relative to the project root, e.g. ["src", "src/routes", "tests"].',
                    },
                    files: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Flat list of every file path that will need real code written to it later, e.g. ["src/app.js", "package.json", "tests/app.test.js"].',
                    },
                },
                required: ['projectName', 'directories', 'files'],
            },
        },
    },
];

// --- Tool 2: exactly one file's content per call ---
// Small, focused JSON payload — a single file's code is far less likely
// to have a nesting/escaping mistake than an entire project's worth at once.
export const writeFileContent = {
    type: 'function',
    function: {
        name: 'write_file_content',
        description:
            'Writes the complete, real, production-ready code for ONE file into the already-created project skeleton. ' +
            'Call this once per file, for every file path that generate_project_structure listed. ' +
            'Never truncate the code and never leave placeholders or TODO comments in place of real logic. ' +
            'If the file is package.json (or another manifest file), it must list every real dependency ' +
            'that any other generated file actually imports or requires.',
        parameters: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The exact file path to write to, matching one of the paths from generate_project_structure\'s files list, e.g. "src/app.js".',
                },
                code: {
                    type: 'string',
                    description: 'The complete source code (or manifest content) for this single file. No markdown code fences, no placeholders.',
                },
            },
            required: ['filePath', 'code'],
        },
    },
};

export const executeTerminalCommands = {
    type: 'function',
    function: {
        name: 'execute_terminal_command',
        description:
            'Execute a terminal command in the project directory. Only use this after generate_project_structure ' +
            'and write_file_content have been called for every file. Use this to install dependencies and run scripts ' +
            'to verify the project works, e.g. execute_terminal_command({command: "npm install", cwd: "project-name"}).',
        parameters: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The terminal command to execute, e.g. "npm install", "npm run test", "node src/index.js".',
                },
                cwd: {
                    type: 'string',
                    description: 'The directory to run the command in, relative to where the agent is running (usually the generated project\'s folder name). Default is the current directory.',
                },
            },
            required: ['command'],
        },
    },
};
// file executer schema
export const listFilesTool = {
    type: 'function',
    function: {
        name: 'list_files',
        description: 'List all the files in the requested directory Only use this after write `@` ',
         parameters: {
            type: 'object',
            properties: {
                directory: {
                    type: 'string',
                    description: 'The directory to list files in, e.g. "src", "tests".',
                },
            },        
            required: ['directory'],
         }
    }
}
export const readFileTool = {
    type: 'function',
    function: {
        name: 'read_file',
        description: 'Reads the contents of a file at the specified path. Useful for reviewing existing code before modifying it.',
        parameters: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The exact file path to read from, e.g. "src/app.js".',
                },
            },
            required: ['filePath'],
        },
    },
};
export const extractUserStoriesTool = {
    type: 'function',
    function: {
        name: 'extract_user_stories',
        description: 'Extracts user stories from the provided PRD document.',
        parameters: {
            type: 'object',
            properties: {
                stories: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'auto generated id for each story' },
                            title: { type: 'string', description: 'title of the story' },
                            description: { type: 'string', description: 'description of the story' },
                            acceptanceCriteria: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'acceptance criteria of the story',
                            },
                        },
                        required: ['id', 'title', 'description', 'acceptanceCriteria'],
                    },
                },
            },
            required: ['stories'],
        },
    }
}