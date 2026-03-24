# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Quick Start

```bash
# Clone the repo
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Initialize local environment
bash init-local.sh

# Start services
docker compose up -d

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Tech Stack

{{TECH_STACK_TABLE}}

## Architecture

See [Architecture.md](Architecture.md) for the full technical architecture.

## Project Structure

```
{{PROJECT_STRUCTURE}}
```

## Development

### Environment Setup
1. Copy example files: `bash init-local.sh`
2. Edit `.env` with real secrets if needed
3. `docker compose up -d` to start services
4. `npm run dev` to start the dev server

### Agents
This project uses AI agents for development. See `.github/agents/` for definitions.

{{AGENT_LIST}}

## License

{{LICENSE}}
