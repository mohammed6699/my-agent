import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { WORKSPACE_ROOT } from "../config.js";

const execPromise = promisify(exec);
export async function executeCommand({ command, cwd }) {
  try {
    const targetDirectory = cwd ? path.resolve(WORKSPACE_ROOT, cwd) : WORKSPACE_ROOT;
    console.log(`Executing Shell Command: "${command}" in ${targetDirectory}...`);

    const { stdout, stderr } = await execPromise(command, {
      cwd: targetDirectory,
      timeout: 180000,
      env: { ...process.env },
      shell: true,
    });

    console.log(`✅ Command Finished Successfully.`);
    return `Command executed successfully:\nSTDOUT:\n${stdout}\n${stderr ? `STDERR:\n${stderr}` : ""}`;
  } catch (error) {
    console.error(`❌ Command Failed: ${error.message}`);
    return `Command failed with error: ${error.message}\nSTDOUT: ${error.stdout || ""}\nSTDERR: ${error.stderr || ""}`;
  }
}