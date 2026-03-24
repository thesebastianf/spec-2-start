# Docker & Environment Setup Standard

## Principle

There are two example files that live in the repo:
- `docker-compose.yaml-example`
- `.env-example`

## Rules

### Example files MUST:
- Always be complete and contain ALL required variables
- Use placeholder / random values (no real secrets)
- Be runnable as-is without modifications
- Include a comment header explaining their purpose

### Local files:
- Copy `docker-compose.yaml-example` → `docker-compose.yaml`
- Copy `.env-example` → `.env`
- Replace secrets with real values if needed
- Add a warning comment: "only for local development, do not use in production"

### Local files MUST:
- Always stay in sync with the example files
- Be updated when examples change
- Be runnable at all times

### On clone (when local files don't exist):
- Automatically create them from the examples
- Use `init-local.sh` / `init-local.ps1` for this

### .gitignore:
- `.env` and `docker-compose.yaml` must be in `.gitignore`
- They are only for local development
- They must NEVER be committed or used in production
