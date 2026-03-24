# Architecture: {{PROJECT_NAME}}

## Overview
{{PROJECT_DESCRIPTION}}

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
{{TECH_STACK_ROWS}}

## System Diagram

```
{{ARCHITECTURE_DIAGRAM}}
```

## Services

{{SERVICES_DESCRIPTION}}

## Data Model

{{DATA_MODEL}}

## API Endpoints

{{API_ENDPOINTS}}

## Security

- Authentication: JWT / Session-based
- All inputs validated at API boundary
- OWASP Top 10 compliance enforced by QA Agent
- Secrets via environment variables only
- HTTPS in production

## Deployment

- Local: Docker Compose (see docker-compose.yaml-example)
- Production: {{PRODUCTION_DEPLOYMENT}}
