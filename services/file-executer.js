import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_ROOT } from "../config.js";

// Core file writing logic
export async function buildProjectFromBlueprint(blueprint, outputRootDir = process.cwd()) {
  const projectFolderName = blueprint.projectName || 'generated-app';
  const projectPath = path.join(outputRootDir, projectFolderName);

  console.log(`\n Executing Tool: Building files at ${projectPath}`);

  // Create the project root folder
  await fs.mkdir(projectPath, { recursive: true });

  // Recursive function to process the nested structure
  async function processItem(item, currentPath) {
    if (!item || !item.name) return;

    const itemPath = path.join(currentPath, item.name);

    if (item.type === 'directory') {
      await fs.mkdir(itemPath, { recursive: true });
      console.log(`Created Directory: ${path.relative(projectPath, itemPath)}`);

      if (Array.isArray(item.contents)) {
        for (const subItem of item.contents) {
          await processItem(subItem, itemPath);
        }
      }
    } else if (item.type === 'file') {
      await fs.mkdir(path.dirname(itemPath), { recursive: true });
      await fs.writeFile(itemPath, item.code || item.content || '', 'utf-8');
      console.log(` Written File: ${path.relative(projectPath, itemPath)}`);
    }
  }

  // Process the directories array (which holds the root-level files and folders in nested/tree structure)
  if (Array.isArray(blueprint.directories)) {
    for (const item of blueprint.directories) {
      if (typeof item === 'string') {
        const fullDirPath = path.join(projectPath, item);
        await fs.mkdir(fullDirPath, { recursive: true });
        console.log(`Created Directory (flat): ${item}`);
      } else {
        await processItem(item, projectPath);
      }
    }
  }

  // Process the files array
  if (Array.isArray(blueprint.files)) {
    for (const file of blueprint.files) {
      if (typeof file === 'object' && file !== null && file.path) {
        const fullFilePath = path.join(projectPath, file.path);
        await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
        await fs.writeFile(fullFilePath, file.content || file.code || '', 'utf-8');
        console.log(`Written File (flat): ${file.path}`);
      } else if (typeof file === 'string') {
        // If it's just a string path (e.g. from the nested schema list of files),
        // we check if it was already created during the directories traversal.
        // If not, we create an empty file.
        const fullFilePath = path.join(projectPath, file);
        try {
          await fs.access(fullFilePath);
        } catch {
          await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
          await fs.writeFile(fullFilePath, '', 'utf-8');
          console.log(`  📄 Written Empty File: ${file}`);
        }
      }
    }
  }

  return `Successfully generated project "${projectFolderName}" with all files and folders written to disk.`;
}

// Zod Schema representing the recursive structure matching schemas.js
// Define explicit level schemas up to depth level 3 (matches schemas.js and prevents Gemini API errors with $ref)
const FileTreeItemLevel3 = z.object({
  name: z.string().describe("Name of the file or directory"),
  type: z.enum(["directory", "file"]).describe("Type of the item"),
  code: z.string().optional().describe("Code content for files (optional)"),
});

const FileTreeItemLevel2 = z.object({
  name: z.string().describe("Name of the file or directory"),
  type: z.enum(["directory", "file"]).describe("Type of the item"),
  code: z.string().optional().describe("Code content for files (optional)"),
  contents: z.array(FileTreeItemLevel3).optional().describe("Nested files or directories (Level 3)"),
});

const FileTreeItemLevel1 = z.object({
  name: z.string().describe("Name of the file or directory"),
  type: z.enum(["directory", "file"]).describe("Type of the item"),
  code: z.string().optional().describe("Code content for files (optional)"),
  contents: z.array(FileTreeItemLevel2).optional().describe("Nested files or directories (Level 2)"),
});

// LangChain Tool Declaration for the ReAct Agent
export const buildProjectTool = tool(
  async ({ blueprint }) => {
    return await buildProjectFromBlueprint(blueprint);
  },
  {
    name: "build_project_structure",
    description: "Takes a project blueprint containing directories and files (with full code content) and creates them on the local disk.",
    schema: z.object({
      blueprint: z.object({
        projectName: z.string().describe("The root directory name for the project"),
        directories: z.array(FileTreeItemLevel1).describe("List of directories and files in the project."),
        files: z.array(z.string()).describe("An array of all files that need to be created within those directories (e.g., ['src/app.js', 'tests/app.test.js'])."),
      }),
    }),
  }
);
let currentProjectPath = null;
export async function createProjectSkeleton({ projectName, directories = [], files = [] }, outputRootDir = WORKSPACE_ROOT) {
  const projectFolderName = projectName || "generated-app";
  const projectPath = path.join(outputRootDir, projectFolderName);

  console.log(`\n🚀 Creating skeleton at ${projectPath}`);
  await fs.mkdir(projectPath, { recursive: true });

  for (const dir of directories) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    console.log(`  📁 Created Directory: ${dir}`);
  }

  for (const file of files) {
    const fullFilePath = path.join(projectPath, file);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    // Empty placeholder for now — write_file_content fills these in next.
    await fs.writeFile(fullFilePath, "", "utf-8");
    console.log(`  📄 Created Empty File: ${file}`);
  }

  // Remember the root so write_file_content can find it later.
  currentProjectPath = projectPath;

  return `Skeleton created for "${projectFolderName}". Now call write_file_content once for EACH file listed above to fill in real code.`;
}

// --- Tool 2's real function: write_file_content ---
// Writes ONE file's real code into the already-created skeleton.
export async function writeFileContentToDisk({ filePath, code }) {
  if (!currentProjectPath) {
    return `Error: no project skeleton exists yet. Call generate_project_structure before write_file_content.`;
  }

  const fullFilePath = path.join(currentProjectPath, filePath);
  await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
  await fs.writeFile(fullFilePath, code ?? "", "utf-8");
  console.log(`  ✏️  Written: ${filePath}`);

  return `Successfully wrote ${filePath}.`;
}
// manage files
export async function listFiles({ directory }) {
  if (!currentProjectPath) {
    return `Error: no project skeleton exists yet. Call generate_project_structure before list_files.`;
  }
  const targetDir = path.join(currentProjectPath, directory || '');
  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => path.join(directory || '', entry.name));
    console.log(`  🔍 Listed ${files.length} files in ${directory}`);
    return files.length > 0 ? files.join('\n') : '(directory is empty)';
  } catch (error) {
    return `Error: could not read directory "${directory || '(root)'}": ${error.message}`;
  }
}
// read file content
export async function readFile({ filePath }) {
  if (!currentProjectPath) {
    return `Error: no project skeleton exists yet. Call generate_project_structure before read_file_content.`;
  }
  const fullFilePath = path.join(currentProjectPath, filePath);
  try {
    const content = await fs.readFile(fullFilePath, 'utf-8');
    console.log(`  📚 Read: ${filePath} (${content.length} characters)`);
    return content;
  } catch (error) {
    console.log(`Error: could not read file ${filePath}: ${error.message}`);
    return `Error: file "${filePath}" could not be read: ${error.message}`;
  }
}
// handle session to save file and data
const SESSION_FILE = path.join(WORKSPACE_ROOT, '.session.json');

export async function saveSession(messages, currentProjectPath) {
  const sessionData = { messages, currentProjectPath };
  const jsonString = JSON.stringify(sessionData, null, 2);
  try {
    await fs.writeFile(SESSION_FILE, jsonString, 'utf-8');
  } catch (error) {
    console.warn('Failed to save session:', error.message);
  }
}
export function getCurrentProjectPath() {
  return currentProjectPath;
}
export async function loadSession() {
  try {
    const jsonString = await fs.readFile(SESSION_FILE, 'utf-8');
    const sessionData = JSON.parse(jsonString);
    currentProjectPath = sessionData.currentProjectPath;
    return sessionData.messages;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.log(chalk.yellow(`Warning: could not load prior session (${error.message}). Starting fresh.`));
    }
    return [];
  }
}
// function to manage .session file
export async function archiveCurrentSession() {
    try {
        const exists = await fs.access(SESSION_FILE).then(() => true).catch(() => false);
        if (!exists) return; // nothing to archive

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(WORKSPACE_ROOT, `.session-archive-${timestamp}.json`);
        await fs.rename(SESSION_FILE, archivePath);
        console.log(chalk.gray(`Previous session archived to ${archivePath}`));
    } catch (error) {
        console.log(chalk.yellow(`Could not archive previous session: ${error.message}`));
    }
} 