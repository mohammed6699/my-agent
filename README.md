# Claude Agent

A Node.js CLI agent that uses Groq models to understand user requests, inspect the workspace, create or modify files, and execute terminal commands. The project is designed as a lightweight automation assistant that can help scaffold applications and work through PRD or NCR-driven workflows.

## Features

- Conversational CLI interface for project automation
- Tool-based execution for reading files, writing files, and running commands
- Support for PRD-based workflow to generate user stories and build features
- Support for NCR-based workflow to scaffold projects from requirements
- Includes a sample React portfolio app under the portfolio-project folder

## Project Structure

- server.js: main entry point for the CLI agent
- ai/: prompt templates and schemas used by the agent
- services/: LLM client, file execution, command execution, and workflow helpers
- portfolio-project/: example React application generated for the portfolio demo

## Requirements

- Node.js 18 or newer
- npm
- A Groq API key

## Installation

1. Install the root dependencies:

```bash
npm install
```

2. Create a .env file in the project root and add your Groq API key:

```env
GROQ_API_KEY=your_api_key_here
```

## Running the Agent

Start the CLI agent:

```bash
node server.js
```

## Notes

This project is an experimental automation tool and may require API access and proper environment configuration to work as intended.

## License

ISC
sed on user prompts, NCR files, PDR files