# Copilot Instructions for {{PROJECT_NAME}}

## Project
- **Name:** {{PROJECT_NAME}}
- **Language:** {{PRIMARY_LANGUAGE}}
- **Description:** {{PROJECT_DESCRIPTION}}

## Instructions

### Prompt Documentation
Every executed prompt MUST be logged in `executed-prompts.md` with:
- Timestamp (ISO 8601)
- Agent that executed it
- Brief summary of what was done
- Files changed

### Documentation
`README.md` and `Architecture.md` MUST be kept up-to-date with every relevant change. If you add a feature, endpoint, page, or service — update the docs.

### SVG Mockups
Create SVG mockups for all UI pages BEFORE starting implementation. Store them in `/mockup/` directory.

{{CUSTOM_INSTRUCTIONS}}

## Docker & Environment
Follow the docker setup standard:
- `docker-compose.yaml-example` and `.env-example` are the source of truth
- Local copies (`docker-compose.yaml`, `.env`) are generated and gitignored
- See `init-local.sh` for automatic setup on clone

## Agents
This project uses the following agents:
{{AGENT_LIST}}

See `.github/agents/` for individual agent definitions.
