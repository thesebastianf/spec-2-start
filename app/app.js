/* ═══════════════════════════════════════════════
   Spec-2-Start — Wizard App Logic
   ═══════════════════════════════════════════════ */

// ──── STATE ────
const state = {
  currentStep: 0,
  repo: { url: '', name: '', branch: 'main', visibility: 'public', mode: '' },
  project: { name: '', description: '', language: 'TypeScript / Node.js', template: 'saas' },
  architecture: { blocks: [], markdown: '' },
  services: [],
  agents: [],
  instructions: [],
  freeInstructions: '',
  localEnvContent: '',
  volumePaths: {},  // e.g. { postgres_data: './data/postgres', redis_data: './data/redis' }
  mcpServers: []
};

const STEP_NAMES = { de: ['Repo', 'Projekt', 'Architektur', 'Docker', 'Agents', 'Instructions', 'MCP', 'Generate'], en: ['Repo', 'Project', 'Architecture', 'Docker', 'Agents', 'Instructions', 'MCP', 'Generate'] };
let currentLang = localStorage.getItem('s2s-lang') || 'de';

// HTML escape to prevent DOM-based XSS when inserting user text via innerHTML
function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

// ──── DEFAULT DATA ────
const DEFAULT_SERVICES = [
  { id: 'app', name: 'app', image: 'node:20-alpine', port: '3000', color: '#22D3A5', enabled: true, abbr: 'ap' },
  { id: 'postgres', name: 'postgres', image: 'postgres:16-alpine', port: '5432', color: '#3B82F6', enabled: true, abbr: 'pg' },
  { id: 'redis', name: 'redis', image: 'redis:7-alpine', port: '6379', color: '#EF4444', enabled: true, abbr: 'rd' },
  { id: 'nginx', name: 'nginx', image: 'nginx:alpine', port: '80/443', color: '#E5E7EB', enabled: false, abbr: 'nx' }
];

const DEFAULT_AGENTS = [
  {
    id: 'orchestrator', name: 'Orchestrator', role: 'Project Coordinator',
    color: '#5B5EF4', bgColor: '#EEEFFE', borderColor: '#5B5EF4', tagBg: '#DBEAFE', tagColor: '#2563EB',
    description: 'Coordinates all agents, plans tasks, delegates work, reviews merge decisions.',
    tags: ['Planning', 'Delegation', 'Review'],
    responsibilities: [
      'Break down user requests into actionable tasks',
      'Delegate tasks to the right specialist agent',
      'Review and merge results from all agents',
      'Maintain overall project consistency',
      'Keep Architecture.md and README.md up to date'
    ],
    instructions: 'You are the project coordinator. Never implement features directly — always delegate. Always verify changes are consistent with Architecture.md before accepting.',
    applyTo: ['**/*']
  },
  {
    id: 'frontend', name: 'Frontend Agent', role: 'UI/UX Developer',
    color: '#818CF8', bgColor: '#EEF2FF', borderColor: '#818CF8', tagBg: '#E0E7FF', tagColor: '#4338CA',
    description: 'React/Next.js components, pages, styling, accessibility, state management.',
    tags: ['React', 'Styling', 'A11y'],
    responsibilities: [
      'Build and maintain React/Next.js components',
      'Implement pages and routing',
      'Styling with Tailwind CSS',
      'Accessibility compliance',
      'Create SVG mockups before implementation'
    ],
    instructions: 'You are the frontend specialist. Always create an SVG mockup before implementing a new page. Use semantic HTML for accessibility. Never use `any` in TypeScript.',
    applyTo: ['src/app/**', 'src/components/**', 'src/styles/**']
  },
  {
    id: 'backend', name: 'Backend Agent', role: 'API & Services Dev',
    color: '#22C55E', bgColor: '#F0FDF4', borderColor: '#4ADE80', tagBg: '#DCFCE7', tagColor: '#166534',
    description: 'REST API Endpoints, Business Logic, Authentication, Middleware, Error Handling.',
    tags: ['API', 'Auth', 'Logic'],
    responsibilities: [
      'Design and implement REST API endpoints',
      'Business logic and domain services',
      'Authentication and authorization',
      'Input validation and error handling',
      'API documentation'
    ],
    instructions: 'You are the backend specialist. Validate all inputs at the API boundary. Use proper HTTP status codes. Keep controllers thin — business logic in service layer. Never expose internal errors to clients.',
    applyTo: ['src/api/**', 'src/services/**', 'src/middleware/**']
  },
  {
    id: 'database', name: 'Database & Data', role: 'Data Engineer',
    color: '#EC4899', bgColor: '#FDF2F8', borderColor: '#EC4899', tagBg: '#FCE7F3', tagColor: '#9D174D',
    description: 'Schema design, migrations, queries, seeding, performance optimization.',
    tags: ['Schema', 'Migration', 'Prisma'],
    responsibilities: [
      'Design and maintain database schema',
      'Create and manage migrations',
      'Write seed data for development',
      'Optimize queries and indexes',
      'Data integrity constraints'
    ],
    instructions: 'You are the database specialist. Every schema change must have a migration. Always add indexes for fields used in WHERE/JOIN. Use transactions for multi-step operations.',
    applyTo: ['prisma/**', 'src/db/**', 'src/models/**']
  },
  {
    id: 'reviewer-qa', name: 'Reviewer / Tester / QA', role: 'Quality Guardian',
    color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#F59E0B', tagBg: '#FEF3C7', tagColor: '#92400E',
    description: 'Code reviews, test strategy, security checks, OWASP, E2E tests, coverage.',
    tags: ['Testing', 'Security', 'OWASP', 'E2E', 'Coverage'],
    responsibilities: [
      'Code reviews for all changes',
      'Security checks (OWASP Top 10)',
      'Test strategy and test case design',
      'End-to-end test scenarios',
      'Documentation review'
    ],
    instructions: 'You are the quality guardian. Review every change for correctness, security, performance, readability. Check OWASP Top 10 on every API change. Flag any use of `any` in TypeScript.',
    applyTo: ['**/*', 'tests/**']
  }
];

const MCP_CATEGORIES = [
  { id: 'ui', de: '🎨 UI & Design', en: '🎨 UI & Design' },
  { id: 'data', de: '🗄️ Datenbanken & Daten', en: '🗄️ Databases & Data' },
  { id: 'dev', de: '🛠️ Entwicklung & Tools', en: '🛠️ Development & Tools' },
  { id: 'test', de: '🧪 Testing & QA', en: '🧪 Testing & QA' },
  { id: 'docs', de: '📚 Docs & Wissen', en: '📚 Docs & Knowledge' },
  { id: 'infra', de: '☁️ Infra & DevOps', en: '☁️ Infra & DevOps' },
  { id: 'ai', de: '🧠 AI & Reasoning', en: '🧠 AI & Reasoning' },
  { id: 'api', de: '🔌 APIs & Services', en: '🔌 APIs & Services' }
];

const DEFAULT_MCPS = [
  // UI & Design
  { id: 'shadcn-ui', name: 'shadcn/ui', category: 'ui', command: 'npx -y @anthropic/shadcn-ui', description: 'shadcn/ui component library', enabled: false },
  { id: 'figma', name: 'Figma', category: 'ui', command: 'npx -y @anthropic/figma-mcp', description: 'Read Figma designs & extract tokens', enabled: false },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'ui', command: 'npx -y @anthropic/tailwindcss-mcp', description: 'Tailwind class lookup & utilities', enabled: false },
  { id: 'storybook', name: 'Storybook', category: 'ui', command: 'npx -y @anthropic/storybook-mcp', description: 'Browse & manage Storybook stories', enabled: false },
  // Databases & Data
  { id: 'postgres', name: 'PostgreSQL', category: 'data', command: 'npx -y @anthropic/postgres-mcp', description: 'Query & manage PostgreSQL databases', enabled: false },
  { id: 'mysql', name: 'MySQL', category: 'data', command: 'npx -y @anthropic/mysql-mcp', description: 'Query & manage MySQL databases', enabled: false },
  { id: 'sqlite', name: 'SQLite', category: 'data', command: 'npx -y @anthropic/sqlite-mcp', description: 'Local SQLite database access', enabled: false },
  { id: 'redis', name: 'Redis', category: 'data', command: 'npx -y @anthropic/redis-mcp', description: 'Redis cache & key-value operations', enabled: false },
  { id: 'prisma', name: 'Prisma', category: 'data', command: 'npx -y @anthropic/prisma-mcp', description: 'Prisma schema & migration helpers', enabled: false },
  { id: 'supabase', name: 'Supabase', category: 'data', command: 'npx -y @anthropic/supabase-mcp', description: 'Supabase DB, Auth & Storage', enabled: false },
  // Development & Tools
  { id: 'filesystem', name: 'Filesystem', category: 'dev', command: 'npx -y @anthropic/filesystem-mcp', description: 'Read/write local filesystem access', enabled: false },
  { id: 'github', name: 'GitHub', category: 'dev', command: 'npx -y @anthropic/github-mcp', description: 'GitHub API — Issues, PRs, repos', enabled: false },
  { id: 'gitlab', name: 'GitLab', category: 'dev', command: 'npx -y @anthropic/gitlab-mcp', description: 'GitLab API — MRs, issues, pipelines', enabled: false },
  { id: 'docker', name: 'Docker', category: 'dev', command: 'npx -y @anthropic/docker-mcp', description: 'Manage containers, images & compose', enabled: false },
  { id: 'npm', name: 'npm', category: 'dev', command: 'npx -y @anthropic/npm-mcp', description: 'Search packages, check versions & deps', enabled: false },
  { id: 'eslint', name: 'ESLint', category: 'dev', command: 'npx -y @anthropic/eslint-mcp', description: 'Run & fix ESLint issues', enabled: false },
  // Testing & QA
  { id: 'playwright', name: 'Playwright', category: 'test', command: 'npx -y @anthropic/playwright-mcp', description: 'Browser automation & E2E testing', enabled: false },
  { id: 'jest', name: 'Jest', category: 'test', command: 'npx -y @anthropic/jest-mcp', description: 'Run & debug Jest test suites', enabled: false },
  { id: 'cypress', name: 'Cypress', category: 'test', command: 'npx -y @anthropic/cypress-mcp', description: 'Cypress E2E test management', enabled: false },
  { id: 'lighthouse', name: 'Lighthouse', category: 'test', command: 'npx -y @anthropic/lighthouse-mcp', description: 'Performance & SEO audits', enabled: false },
  // Docs & Knowledge
  { id: 'context7', name: 'Context7', category: 'docs', command: 'npx -y @upstash/context7-mcp@latest', description: 'Up-to-date docs & code examples for any library', enabled: false },
  { id: 'mdn', name: 'MDN Web Docs', category: 'docs', command: 'npx -y @anthropic/mdn-mcp', description: 'MDN web reference & browser compat', enabled: false },
  { id: 'openapi', name: 'OpenAPI', category: 'docs', command: 'npx -y @anthropic/openapi-mcp', description: 'Parse & explore OpenAPI/Swagger specs', enabled: false },
  { id: 'notion', name: 'Notion', category: 'docs', command: 'npx -y @anthropic/notion-mcp', description: 'Read & search Notion workspaces', enabled: false },
  // Infra & DevOps
  { id: 'kubernetes', name: 'Kubernetes', category: 'infra', command: 'npx -y @anthropic/kubernetes-mcp', description: 'K8s cluster management & kubectl', enabled: false },
  { id: 'terraform', name: 'Terraform', category: 'infra', command: 'npx -y @anthropic/terraform-mcp', description: 'Terraform plan, apply & state', enabled: false },
  { id: 'aws', name: 'AWS', category: 'infra', command: 'npx -y @anthropic/aws-mcp', description: 'AWS services — S3, Lambda, EC2 etc.', enabled: false },
  { id: 'vercel', name: 'Vercel', category: 'infra', command: 'npx -y @anthropic/vercel-mcp', description: 'Vercel deployments & project config', enabled: false },
  { id: 'cloudflare', name: 'Cloudflare', category: 'infra', command: 'npx -y @anthropic/cloudflare-mcp', description: 'Cloudflare Workers, DNS & Pages', enabled: false },
  // AI & Reasoning
  { id: 'sequential-thinking', name: 'Sequential Thinking', category: 'ai', command: 'npx -y @anthropic/sequential-thinking-mcp', description: 'Step-by-step reasoning for complex tasks', enabled: false },
  { id: 'memory', name: 'Memory', category: 'ai', command: 'npx -y @anthropic/memory-mcp', description: 'Persistent memory across conversations', enabled: false },
  // APIs & Services
  { id: 'slack', name: 'Slack', category: 'api', command: 'npx -y @anthropic/slack-mcp', description: 'Send messages, read channels', enabled: false },
  { id: 'linear', name: 'Linear', category: 'api', command: 'npx -y @anthropic/linear-mcp', description: 'Linear issues, projects & cycles', enabled: false },
  { id: 'sentry', name: 'Sentry', category: 'api', command: 'npx -y @anthropic/sentry-mcp', description: 'Error tracking & performance monitoring', enabled: false },
  { id: 'stripe', name: 'Stripe', category: 'api', command: 'npx -y @anthropic/stripe-mcp', description: 'Stripe payments, subscriptions & invoices', enabled: false },
  { id: 'resend', name: 'Resend', category: 'api', command: 'npx -y @anthropic/resend-mcp', description: 'Send transactional emails via Resend', enabled: false }
];

const DEFAULT_INSTRUCTIONS = [
  { id: 'prompt-doc', title: 'Prompt Documentation', description: 'Every executed prompt must be logged in executed-prompts.md with a timestamp.', isDefault: true, enabled: true },
  { id: 'docs-current', title: 'Keep Docs Up-to-Date', description: 'README.md and Architecture.md must be updated with every relevant change.', isDefault: true, enabled: true },
  { id: 'svg-mockups', title: 'SVG Mockups First', description: 'Create SVG mockups for all UI pages before starting implementation.', isDefault: true, enabled: true }
];

// ──── INIT ────
function init() {
  state.services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
  state.agents = JSON.parse(JSON.stringify(DEFAULT_AGENTS));
  state.instructions = JSON.parse(JSON.stringify(DEFAULT_INSTRUCTIONS));
  state.mcpServers = [];
  renderStepNav();
  renderStep(0);
  setupListeners();
}

function setupListeners() {
  const desc = document.getElementById('projectDesc');
  if (desc) {
    desc.addEventListener('input', () => {
      state.project.description = desc.value;
      document.getElementById('charCount').textContent = desc.value.length;
      updateDetectedTerms();
      updateSuggestedStack();
    });
  }
}

// ──── NAVIGATION ────
function goStep(n) {
  // Save current step state first
  saveCurrentState();
  state.currentStep = n;
  // Hide all, show target
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  const target = document.querySelector(`[data-step="${n}"]`);
  if (target) target.classList.remove('hidden');
  renderStepNav();
  renderStep(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStepNav() {
  const nav = document.getElementById('stepsNav');
  const names = STEP_NAMES[currentLang] || STEP_NAMES.de;
  nav.innerHTML = names.map((name, i) => {
    let cls = 'step-pill ';
    if (i < state.currentStep) cls += 'done';
    else if (i === state.currentStep) cls += 'active';
    else cls += 'pending';
    return `<div class="${cls}" onclick="goStep(${i})">${i > 0 ? i + ' ' : ''}${name}</div>`;
  }).join('');
}

function renderStep(n) {
  switch (n) {
    case 1: renderProjectStep(); break;
    case 2: renderArchStep(); break;
    case 3: renderDockerStep(); break;
    case 4: renderAgentsStep(); break;
    case 5: renderInstructionsStep(); break;
    case 6: renderMcpStep(); break;
    case 7: renderReviewStep(); break;
  }
}

function saveCurrentState() {
  const name = document.getElementById('projectName');
  if (name) state.project.name = name.value;
  const lang = document.getElementById('projectLang');
  if (lang) state.project.language = lang.value;
  const desc = document.getElementById('projectDesc');
  if (desc) state.project.description = desc.value;
  const arch = document.getElementById('archMd');
  if (arch) state.architecture.markdown = arch.value;
  const env = document.getElementById('envVars');
  if (env) state.envContent = env.value;
  const free = document.getElementById('freeInstructions');
  if (free) state.freeInstructions = free.value;
}

// ──── STEP 0: Repo ────
function connectRepo() {
  const url = document.getElementById('repoUrl').value.trim();
  if (!url) return;
  state.repo.url = url;
  // Parse owner/name from URL or shorthand
  const match = url.match(/(?:github\.com\/)?([^\/]+\/[^\/\s]+)/);
  state.repo.name = match ? match[1].replace(/\.git$/, '') : url;
  state.repo.branch = document.getElementById('repoBranch').value;
  state.repo.token = document.getElementById('ghToken').value.trim();
  state.repo.mode = 'existing';
  showRepoBadge();
  goStep(1);
}

function createNewRepo() {
  const name = document.getElementById('newRepoName').value.trim();
  if (!name) return;
  state.repo.token = document.getElementById('ghTokenNew').value.trim();
  state.repo.name = name;
  state.repo.mode = 'new';
  state.project.name = name;
  showRepoBadge();
  goStep(1);
}

function startLocal() {
  state.repo.mode = 'local';
  state.repo.name = 'local';
  showRepoBadge();
  goStep(1);
}

function showRepoBadge() {
  const badge = document.getElementById('repoBadge');
  badge.classList.remove('hidden');
  document.getElementById('repoBadgeText').textContent = state.repo.name;
}

function selectVisibility(el, val) {
  document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.repo.visibility = val;
}

// ──── STEP 1: Project ────
function renderProjectStep() {
  const desc = document.getElementById('projectDesc');
  if (desc && state.project.description) desc.value = state.project.description;
  const name = document.getElementById('projectName');
  if (name && state.project.name) name.value = state.project.name;
  document.getElementById('charCount').textContent = (state.project.description || '').length;
  updateDetectedTerms();
  updateSuggestedStack();
}

function selectTemplate(el, type) {
  document.querySelectorAll('#templates .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  state.project.template = type;
  const templates = {
    saas: 'Ich baue eine SaaS Plattform mit User-Management, Dashboard und REST API.',
    cli: 'Ein CLI Tool für Entwickler mit Konfigurationsmanagement und Plugin-System.',
    micro: 'Eine Microservices-Architektur mit Event-Driven Communication und API Gateway.',
    api: 'Einen reinen REST API Service mit Authentication, CRUD Endpoints und Dokumentation.',
    mobile: 'Eine Mobile App mit React Native, Offline-Support und Push Notifications.',
    data: 'Eine Data Pipeline mit ETL/ELT, Batch Processing und Monitoring Dashboard.'
  };
  document.getElementById('projectDesc').value = templates[type] || '';
  state.project.description = templates[type] || '';
  document.getElementById('charCount').textContent = state.project.description.length;
  updateDetectedTerms();
  updateSuggestedStack();
}

function updateDetectedTerms() {
  const text = (state.project.description || '').toLowerCase();
  const keywords = [
    { term: 'SaaS', match: /saas/i },
    { term: 'API', match: /api/i },
    { term: 'REST', match: /rest/i },
    { term: 'Dashboard', match: /dashboard/i },
    { term: 'Auth', match: /auth|login|user/i },
    { term: 'E-Mail', match: /mail|email|notification/i },
    { term: 'Database', match: /datenbank|database|db|crud/i },
    { term: 'Teams', match: /team/i },
    { term: 'Mobile', match: /mobile|app/i },
    { term: 'Microservice', match: /microservice/i },
    { term: 'CLI', match: /\bcli\b|command/i },
    { term: 'Pipeline', match: /pipeline|etl|batch/i },
    { term: 'Plugin', match: /plugin/i },
    { term: 'Offline', match: /offline/i },
    { term: 'Push', match: /push\s?notification/i },
    { term: 'Event-Driven', match: /event/i }
  ];
  const found = keywords.filter(k => k.match.test(text));
  const container = document.getElementById('detectedTerms');
  if (container) {
    container.innerHTML = found.map(k => `<span class="chip blue">${k.term}</span>`).join('');
  }
}

function updateSuggestedStack() {
  const text = (state.project.description || '').toLowerCase();
  const stacks = [];
  if (/react|next|dashboard|frontend|ui/i.test(text)) stacks.push('Frontend: React / Next.js');
  if (/api|backend|service|rest/i.test(text)) stacks.push('Backend: Node.js / Express');
  if (/datenbank|database|crud|user/i.test(text)) stacks.push('Database: PostgreSQL + Redis');
  if (/docker|container|deploy/i.test(text) || stacks.length > 0) stacks.push('Infra: Docker Compose');
  if (/mobile|react native/i.test(text)) stacks.push('Mobile: React Native / Expo');
  if (/cli|command/i.test(text)) stacks.push('Runtime: Node.js CLI');
  if (/pipeline|etl|batch/i.test(text)) stacks.push('Pipeline: Apache Airflow');
  if (stacks.length === 0) stacks.push(t('js.stackPending'));
  const container = document.getElementById('suggestedStack');
  if (container) {
    container.innerHTML = stacks.map(s => `<div class="stack-item">${s}</div>`).join('');
  }
}

// ──── STEP 2: Architecture ────
const BLOCK_COLORS = [
  { bg: '#EEF2FF', border: '#818CF8', color: '#4338CA' },
  { bg: '#F0FDF4', border: '#4ADE80', color: '#166534' },
  { bg: '#FDF2F8', border: '#EC4899', color: '#9D174D' },
  { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E' },
  { bg: '#FFF7ED', border: '#FB923C', color: '#C2410C' },
  { bg: '#F0F9FF', border: '#38BDF8', color: '#0369A1' },
  { bg: '#FDF4FF', border: '#C084FC', color: '#7E22CE' }
];

const ARCH_CATEGORIES = [
  { id: 'frontend', de: '🎨 Frontend', en: '🎨 Frontend' },
  { id: 'backend', de: '⚙️ Backend', en: '⚙️ Backend' },
  { id: 'data', de: '🗄️ Datenbank & Storage', en: '🗄️ Database & Storage' },
  { id: 'auth', de: '🔐 Auth & Security', en: '🔐 Auth & Security' },
  { id: 'infra', de: '☁️ Infra & DevOps', en: '☁️ Infra & DevOps' },
  { id: 'messaging', de: '📨 Messaging & Events', en: '📨 Messaging & Events' },
  { id: 'ai', de: '🧠 AI & ML', en: '🧠 AI & ML' },
  { id: 'mobile', de: '📱 Mobile & Cross-Platform', en: '📱 Mobile & Cross-Platform' }
];

const DEFAULT_ARCH_BLOCKS = [
  // Frontend
  { id: 'nextjs', category: 'frontend', title: 'Next.js', tech: 'Next.js 14 + React', detail: 'App Router + Server Components' },
  { id: 'vite-react', category: 'frontend', title: 'Vite + React', tech: 'Vite + React 18', detail: 'SPA with HMR' },
  { id: 'nuxt', category: 'frontend', title: 'Nuxt', tech: 'Nuxt 3 + Vue 3', detail: 'SSR / SSG with auto-imports' },
  { id: 'svelte', category: 'frontend', title: 'SvelteKit', tech: 'SvelteKit 2', detail: 'Full-stack Svelte framework' },
  { id: 'angular', category: 'frontend', title: 'Angular', tech: 'Angular 17+', detail: 'Signals + Standalone Components' },
  { id: 'tailwind', category: 'frontend', title: 'Tailwind CSS', tech: 'Tailwind CSS 3', detail: 'Utility-first styling' },
  { id: 'shadcn', category: 'frontend', title: 'shadcn/ui', tech: 'shadcn/ui + Radix', detail: 'Accessible component library' },
  { id: 'storybook', category: 'frontend', title: 'Storybook', tech: 'Storybook 8', detail: 'Component development & docs' },
  // Backend
  { id: 'express', category: 'backend', title: 'Express', tech: 'Node.js + Express', detail: 'REST API + Middleware' },
  { id: 'fastify', category: 'backend', title: 'Fastify', tech: 'Node.js + Fastify', detail: 'High-perf JSON APIs' },
  { id: 'nestjs', category: 'backend', title: 'NestJS', tech: 'NestJS + TypeScript', detail: 'Enterprise-grade framework' },
  { id: 'django', category: 'backend', title: 'Django', tech: 'Python + Django', detail: 'Batteries-included web framework' },
  { id: 'fastapi', category: 'backend', title: 'FastAPI', tech: 'Python + FastAPI', detail: 'Async REST + auto OpenAPI docs' },
  { id: 'spring', category: 'backend', title: 'Spring Boot', tech: 'Java + Spring Boot', detail: 'Enterprise Java framework' },
  { id: 'dotnet', category: 'backend', title: '.NET', tech: 'ASP.NET Core', detail: 'C# Web API' },
  { id: 'graphql', category: 'backend', title: 'GraphQL', tech: 'GraphQL + Apollo', detail: 'Typed query API' },
  { id: 'trpc', category: 'backend', title: 'tRPC', tech: 'tRPC v11', detail: 'End-to-end typesafe APIs' },
  // Database & Storage
  { id: 'postgres', category: 'data', title: 'PostgreSQL', tech: 'PostgreSQL 16', detail: 'Primary relational DB' },
  { id: 'mysql', category: 'data', title: 'MySQL', tech: 'MySQL 8', detail: 'Relational DB' },
  { id: 'mongodb', category: 'data', title: 'MongoDB', tech: 'MongoDB 7', detail: 'Document store' },
  { id: 'redis', category: 'data', title: 'Redis', tech: 'Redis 7', detail: 'Cache + Queue + Sessions' },
  { id: 'prisma', category: 'data', title: 'Prisma', tech: 'Prisma ORM', detail: 'Type-safe database client' },
  { id: 'drizzle', category: 'data', title: 'Drizzle', tech: 'Drizzle ORM', detail: 'Lightweight TypeScript ORM' },
  { id: 'supabase', category: 'data', title: 'Supabase', tech: 'Supabase', detail: 'Postgres + Auth + Storage + Realtime' },
  { id: 's3', category: 'data', title: 'S3 / MinIO', tech: 'S3-compatible Storage', detail: 'Object storage for files & media' },
  { id: 'elasticsearch', category: 'data', title: 'Elasticsearch', tech: 'Elasticsearch 8', detail: 'Full-text search & analytics' },
  // Auth & Security
  { id: 'nextauth', category: 'auth', title: 'NextAuth.js', tech: 'NextAuth.js v5', detail: 'OAuth + Credentials + JWT' },
  { id: 'clerk', category: 'auth', title: 'Clerk', tech: 'Clerk', detail: 'Drop-in auth UI + user management' },
  { id: 'keycloak', category: 'auth', title: 'Keycloak', tech: 'Keycloak', detail: 'Self-hosted IAM + SSO' },
  { id: 'jwt', category: 'auth', title: 'JWT Auth', tech: 'JSON Web Tokens', detail: 'Stateless token authentication' },
  { id: 'oauth2', category: 'auth', title: 'OAuth 2.0', tech: 'OAuth 2.0 / OIDC', detail: 'Third-party login (Google, GitHub, etc.)' },
  // Infra & DevOps
  { id: 'docker', category: 'infra', title: 'Docker', tech: 'Docker Compose', detail: 'Container orchestration' },
  { id: 'nginx', category: 'infra', title: 'nginx', tech: 'nginx', detail: 'Reverse Proxy + SSL termination' },
  { id: 'traefik', category: 'infra', title: 'Traefik', tech: 'Traefik', detail: 'Auto-discovery reverse proxy' },
  { id: 'kubernetes', category: 'infra', title: 'Kubernetes', tech: 'K8s', detail: 'Container orchestration at scale' },
  { id: 'terraform', category: 'infra', title: 'Terraform', tech: 'Terraform / OpenTofu', detail: 'Infrastructure as Code' },
  { id: 'gh-actions', category: 'infra', title: 'GitHub Actions', tech: 'GitHub Actions', detail: 'CI/CD pipelines' },
  { id: 'vercel', category: 'infra', title: 'Vercel', tech: 'Vercel', detail: 'Edge deployment + Serverless' },
  // Messaging & Events
  { id: 'rabbitmq', category: 'messaging', title: 'RabbitMQ', tech: 'RabbitMQ', detail: 'Message broker + queues' },
  { id: 'kafka', category: 'messaging', title: 'Kafka', tech: 'Apache Kafka', detail: 'Event streaming platform' },
  { id: 'bullmq', category: 'messaging', title: 'BullMQ', tech: 'BullMQ + Redis', detail: 'Job queue for Node.js' },
  { id: 'websocket', category: 'messaging', title: 'WebSocket', tech: 'WebSocket / Socket.io', detail: 'Real-time bidirectional communication' },
  // AI & ML
  { id: 'openai', category: 'ai', title: 'OpenAI', tech: 'OpenAI API', detail: 'GPT + Embeddings + DALL-E' },
  { id: 'langchain', category: 'ai', title: 'LangChain', tech: 'LangChain', detail: 'LLM orchestration & RAG' },
  { id: 'vector-db', category: 'ai', title: 'Vector DB', tech: 'Pinecone / Qdrant / pgvector', detail: 'Embedding storage & similarity search' },
  { id: 'huggingface', category: 'ai', title: 'Hugging Face', tech: 'Transformers', detail: 'Open-source AI models' },
  // Mobile & Cross-Platform
  { id: 'react-native', category: 'mobile', title: 'React Native', tech: 'React Native + Expo', detail: 'Cross-platform mobile apps' },
  { id: 'flutter', category: 'mobile', title: 'Flutter', tech: 'Flutter + Dart', detail: 'Cross-platform UI toolkit' },
  { id: 'expo', category: 'mobile', title: 'Expo', tech: 'Expo SDK', detail: 'Simplified React Native development' },
  { id: 'electron', category: 'mobile', title: 'Electron', tech: 'Electron', detail: 'Desktop apps with web tech' },
  { id: 'tauri', category: 'mobile', title: 'Tauri', tech: 'Tauri + Rust', detail: 'Lightweight desktop apps' }
];

function ensureArchBlocks() {
  if (state.architecture.blocks.length === 0) {
    // Pre-select sensible defaults from the chips catalog
    const preselected = ['nextjs', 'tailwind', 'express', 'postgres', 'redis', 'docker', 'nginx'];
    preselected.forEach(id => {
      const tpl = DEFAULT_ARCH_BLOCKS.find(b => b.id === id);
      if (tpl) {
        const c = BLOCK_COLORS[state.architecture.blocks.length % BLOCK_COLORS.length];
        state.architecture.blocks.push({ title: tpl.title, tech: tpl.tech, detail: tpl.detail, ...c });
      }
    });
  }
}

function renderArchStep() {
  ensureArchBlocks();
  renderArchSuggestions();
  const diagram = document.getElementById('archDiagram');
  diagram.innerHTML = state.architecture.blocks.map((b, i) => `
    <div class="arch-block" style="background:${b.bg};border-color:${b.border}" onclick="editArchBlock(${i})">
      <div class="arch-block-actions">
        <div class="edit-icon" style="background:${b.border}30;color:${b.color}">✎</div>
        <div class="delete-icon" style="background:#EF444420;color:#EF4444" onclick="event.stopPropagation();quickDeleteArchBlock(${i})"><svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 3h9M4 3V2h3v1M2 3l.7 7.5a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5L9 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="4.5" y1="5.5" x2="4.5" y2="8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="6.5" y1="5.5" x2="6.5" y2="8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></div>
      </div>
      <h4 style="color:${b.color}">${esc(b.title)}</h4>
      <p>${esc(b.tech)}</p>
      <p>${esc(b.detail)}</p>
    </div>
  `).join('');

  const md = document.getElementById('archMd');
  if (!state.architecture.markdown) {
    state.architecture.markdown = generateArchMarkdown(state.architecture.blocks);
  }
  md.value = state.architecture.markdown;
}

let editingArchIdx = -1;

function editArchBlock(idx) {
  editingArchIdx = idx;
  const b = state.architecture.blocks[idx];
  document.getElementById('archModalTitle').textContent = `"${b.title}" ${t('js.editBlock')}`;
  document.getElementById('archEditTitle').value = b.title;
  document.getElementById('archEditTech').value = b.tech;
  document.getElementById('archEditDetail').value = b.detail;
  document.getElementById('archDeleteBtn').style.display = '';
  document.getElementById('archModal').classList.remove('hidden');
}

function closeArchModal() {
  document.getElementById('archModal').classList.add('hidden');
  editingArchIdx = -1;
}

function saveArchBlock() {
  const title = document.getElementById('archEditTitle').value.trim();
  const tech = document.getElementById('archEditTech').value.trim();
  const detail = document.getElementById('archEditDetail').value.trim();
  if (!title) return;
  if (editingArchIdx >= 0) {
    Object.assign(state.architecture.blocks[editingArchIdx], { title, tech, detail });
  } else {
    const c = BLOCK_COLORS[state.architecture.blocks.length % BLOCK_COLORS.length];
    state.architecture.blocks.push({ title, tech, detail, ...c });
  }
  state.architecture.markdown = generateArchMarkdown(state.architecture.blocks);
  closeArchModal();
  renderArchStep();
}

function deleteArchBlock() {
  if (editingArchIdx >= 0 && confirm(`"${state.architecture.blocks[editingArchIdx].title}" ${t('js.confirmDelete')}`)) {
    state.architecture.blocks.splice(editingArchIdx, 1);
    state.architecture.markdown = generateArchMarkdown(state.architecture.blocks);
    closeArchModal();
    renderArchStep();
  }
}

function quickDeleteArchBlock(idx) {
  if (confirm(`"${state.architecture.blocks[idx].title}" ${t('js.confirmDelete')}`)) {
    state.architecture.blocks.splice(idx, 1);
    state.architecture.markdown = generateArchMarkdown(state.architecture.blocks);
    renderArchStep();
  }
}

function generateArchMarkdown(blocks) {
  const name = state.project.name || 'my-project';
  const desc = state.project.description || 'Project description';
  let md = `# Architecture: ${name}\n\n`;
  md += `## Overview\n${desc}\n\n`;
  md += `## Tech Stack\n\n`;
  md += `| Layer | Technology | Purpose |\n|-------|-----------|----------|\n`;
  blocks.forEach(b => { md += `| ${b.title} | ${b.tech} | ${b.detail} |\n`; });
  md += `\n## Services\n\nAll services run in Docker Compose containers.\n`;
  md += `See docker-compose.yaml-example for the complete setup.\n\n`;
  md += `## Security\n- OWASP Top 10 compliance enforced by QA Agent\n- JWT Authentication\n- Input validation at API boundary\n- Secrets via environment variables only\n`;
  return md;
}

function addArchBlock() {
  editingArchIdx = -1;
  document.getElementById('archModalTitle').textContent = t('js.newBlock');
  document.getElementById('archEditTitle').value = '';
  document.getElementById('archEditTech').value = '';
  document.getElementById('archEditDetail').value = '';
  document.getElementById('archDeleteBtn').style.display = 'none';
  document.getElementById('archModal').classList.remove('hidden');
}

function renderArchSuggestions() {
  const container = document.getElementById('archSuggestions');
  container.innerHTML = ARCH_CATEGORIES.map(cat => {
    const items = DEFAULT_ARCH_BLOCKS.filter(b => b.category === cat.id);
    if (items.length === 0) return '';
    const label = cat[currentLang] || cat.de;
    return `<div class="mcp-category">
      <div class="mcp-category-label">${label}</div>
      <div class="chip-row">${items.map(b => {
        const active = state.architecture.blocks.some(x => x.title === b.title);
        return `<div class="chip ${active ? 'active' : ''}" onclick="toggleArchSuggestion('${b.id}')" title="${esc(b.tech)} — ${esc(b.detail)}">${esc(b.title)}</div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
}

function toggleArchSuggestion(id) {
  const tpl = DEFAULT_ARCH_BLOCKS.find(b => b.id === id);
  if (!tpl) return;
  const idx = state.architecture.blocks.findIndex(x => x.title === tpl.title);
  if (idx >= 0) {
    state.architecture.blocks.splice(idx, 1);
  } else {
    const c = BLOCK_COLORS[state.architecture.blocks.length % BLOCK_COLORS.length];
    state.architecture.blocks.push({ title: tpl.title, tech: tpl.tech, detail: tpl.detail, ...c });
  }
  state.architecture.markdown = generateArchMarkdown(state.architecture.blocks);
  renderArchStep();
}

function regenerateArch() {
  state.architecture.blocks = [];
  state.architecture.markdown = '';
  renderArchStep();
}

// ──── STEP 3: Docker ────
function renderDockerStep() {
  renderServices();
  renderDockerPreview('compose');
  const env = document.getElementById('envVars');
  if (!state.envContent) {
    state.envContent = generateEnvContent();
  }
  env.value = state.envContent;
  renderVolumePaths();
}

function renderVolumePaths() {
  const container = document.getElementById('volumePathInputs');
  const volumes = [];
  if (state.services.find(s => s.id === 'postgres' && s.enabled)) {
    volumes.push({ key: 'postgres_data', label: 'postgres_data', defaultPath: './data/postgres' });
  }
  if (state.services.find(s => s.id === 'redis' && s.enabled)) {
    volumes.push({ key: 'redis_data', label: 'redis_data', defaultPath: './data/redis' });
  }
  if (volumes.length === 0) {
    container.innerHTML = `<p style="font-size:11px;color:var(--text-muted)">${t('js.noVolumes')}</p>`;
    return;
  }
  container.innerHTML = volumes.map(v => `
    <div class="volume-path-row">
      <label>${esc(v.label)}</label>
      <input type="text" value="${esc(state.volumePaths[v.key] || v.defaultPath)}"
             placeholder="${v.defaultPath}"
             onchange="updateVolumePath('${v.key}', this.value)">
    </div>
  `).join('');
}

function updateVolumePath(key, val) {
  state.volumePaths[key] = val;
  if (currentDockerTab === 'localCompose') {
    renderDockerPreview('localCompose');
  }
}

function renderServices() {
  const list = document.getElementById('servicesList');
  list.innerHTML = state.services.map((s, i) => `
    <div class="service-card ${s.enabled ? '' : 'inactive'}">
      <div class="service-icon" style="background:${s.color}">${esc(s.abbr)}</div>
      <div class="service-info">
        <h4>${esc(s.name)}</h4>
        <p>${esc(s.image)}</p>
      </div>
      <label class="port-label">Port
        <input type="text" class="port-input" value="${esc(s.port)}" 
               onchange="updateServicePort(${i}, this.value)" 
               onclick="event.stopPropagation()" placeholder="Port">
      </label>
      ${!s.enabled ? '<span style="font-size:10px;color:#9CA3AF">optional</span>' : ''}
      <div class="service-toggle ${s.enabled ? 'on' : 'off'}" onclick="toggleService(${i})">
        ${s.enabled ? '\u2713' : '\u2014'}
      </div>
    </div>
  `).join('');
}

function updateServicePort(idx, val) {
  state.services[idx].port = val;
  renderDockerPreview(currentDockerTab);
}

function toggleService(idx) {
  state.services[idx].enabled = !state.services[idx].enabled;
  renderServices();
  renderDockerPreview('compose');
}

function addService() {
  const name = prompt(t('js.serviceNamePrompt'));
  if (!name) return;
  const image = prompt(t('js.serviceImagePrompt'), `${name}:latest`);
  const port = prompt(t('js.servicePortPrompt'), '8080');
  state.services.push({
    id: name, name, image: image || `${name}:latest`,
    port: port || '8080', color: '#6B7280', enabled: true,
    abbr: name.substring(0, 2)
  });
  renderServices();
  renderDockerPreview('compose');
}

let currentDockerTab = 'compose';

function renderDockerPreview(tab) {
  currentDockerTab = tab;
  const pre = document.getElementById('dockerPreview');
  switch (tab) {
    case 'compose':    pre.textContent = generateComposeYaml(); break;
    case 'env':        pre.textContent = state.envContent || generateEnvContent(); break;
    case 'localCompose': pre.textContent = generateLocalComposeYaml(); break;
    case 'localEnv':   pre.textContent = state.localEnvContent || generateLocalEnvContent(); break;
    case 'gitignore':  pre.textContent = generateGitignore(); break;
  }
}

function switchDockerTab(el, tab) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDockerPreview(tab);
}

function generateComposeYaml() {
  let yaml = `# ===================================\n`;
  yaml += `# docker-compose.yaml-example\n`;
  yaml += `# Complete and runnable as-is\n`;
  yaml += `# ===================================\n\n`;
  yaml += `services:\n`;
  state.services.filter(s => s.enabled).forEach(s => {
    yaml += `  ${s.name}:\n`;
    if (s.id === 'app') {
      yaml += `    build: .\n`;
    } else {
      yaml += `    image: ${s.image}\n`;
    }
    yaml += `    ports:\n      - "${s.port.split('/')[0]}:${s.port.split('/')[0]}"\n`;
    if (s.id === 'app') {
      yaml += `    env_file: .env\n`;
      const deps = state.services.filter(x => x.enabled && x.id !== 'app').map(x => x.name);
      if (deps.length) { yaml += `    depends_on:\n`; deps.forEach(d => { yaml += `      - ${d}\n`; }); }
    }
    if (s.id === 'postgres') {
      yaml += `    environment:\n`;
      yaml += `      POSTGRES_USER: \${POSTGRES_USER:-local_user}\n`;
      yaml += `      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-change_me}\n`;
      yaml += `      POSTGRES_DB: \${POSTGRES_DB:-app_dev}\n`;
      yaml += `    volumes:\n      - postgres_data:/var/lib/postgresql/data\n`;
    }
    if (s.id === 'redis') {
      yaml += `    command: redis-server --appendonly yes\n`;
      yaml += `    volumes:\n      - redis_data:/data\n`;
    }
    yaml += `\n`;
  });
  const hasVolumes = state.services.some(s => s.enabled && (s.id === 'postgres' || s.id === 'redis'));
  if (hasVolumes) {
    yaml += `volumes:\n`;
    if (state.services.find(s => s.id === 'postgres' && s.enabled)) yaml += `  postgres_data:\n`;
    if (state.services.find(s => s.id === 'redis' && s.enabled)) yaml += `  redis_data:\n`;
  }
  return yaml;
}

function generateEnvContent() {
  let env = `# ===================================\n`;
  env += `# .env-example\n`;
  env += `# All placeholder values — no real secrets\n`;
  env += `# ===================================\n\n`;
  env += `NODE_ENV=development\nAPP_PORT=3000\nAPP_SECRET=replace-with-random-secret\n\n`;
  if (state.services.find(s => s.id === 'postgres' && s.enabled)) {
    env += `# Database\nPOSTGRES_USER=local_user\nPOSTGRES_PASSWORD=change_me_123\nPOSTGRES_DB=app_dev\nDATABASE_URL=postgresql://local_user:change_me_123@postgres:5432/app_dev\n\n`;
  }
  if (state.services.find(s => s.id === 'redis' && s.enabled)) {
    env += `# Redis\nREDIS_URL=redis://redis:6379\n`;
  }
  return env;
}
function generateLocalComposeYaml() {
  let yaml = `# \u26a0\ufe0f  WARNING: only for local development \u2014 do NOT commit\n`;
  yaml += `# Generated from docker-compose.yaml-example\n`;
  yaml += `# \u2192 Host volume paths can be customized below\n`;
  yaml += `# ===================================\n\n`;
  yaml += `services:\n`;
  state.services.filter(s => s.enabled).forEach(s => {
    yaml += `  ${s.name}:\n`;
    if (s.id === 'app') {
      yaml += `    build: .\n`;
    } else {
      yaml += `    image: ${s.image}\n`;
    }
    yaml += `    ports:\n      - "${s.port.split('/')[0]}:${s.port.split('/')[0]}"\n`;
    if (s.id === 'app') {
      yaml += `    env_file: .env\n`;
      const deps = state.services.filter(x => x.enabled && x.id !== 'app').map(x => x.name);
      if (deps.length) { yaml += `    depends_on:\n`; deps.forEach(d => { yaml += `      - ${d}\n`; }); }
    }
    if (s.id === 'postgres') {
      yaml += `    environment:\n`;
      yaml += `      POSTGRES_USER: \${POSTGRES_USER:-local_user}\n`;
      yaml += `      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-change_me}\n`;
      yaml += `      POSTGRES_DB: \${POSTGRES_DB:-app_dev}\n`;
      const pgPath = state.volumePaths.postgres_data || './data/postgres';
      yaml += `    volumes:\n      - ${pgPath}:/var/lib/postgresql/data  # \u2190 HOST PATH\n`;
    }
    if (s.id === 'redis') {
      yaml += `    command: redis-server --appendonly yes\n`;
      const rdPath = state.volumePaths.redis_data || './data/redis';
      yaml += `    volumes:\n      - ${rdPath}:/data  # \u2190 HOST PATH\n`;
    }
    yaml += `\n`;
  });
  yaml += `# No named volumes \u2014 using host bind-mounts instead\n`;
  return yaml;
}

function generateLocalEnvContent() {
  let env = `# \u26a0\ufe0f  WARNING: only for local development \u2014 do NOT commit\n`;
  env += `# Generated from .env-example \u2014 replace with REAL values\n`;
  env += `# ===================================\n\n`;
  env += `NODE_ENV=development\nAPP_PORT=3000\nAPP_SECRET=  # \u2190 GENERATE A REAL SECRET\n\n`;
  if (state.services.find(s => s.id === 'postgres' && s.enabled)) {
    env += `# Database (use strong passwords!)\n`;
    env += `POSTGRES_USER=local_user\n`;
    env += `POSTGRES_PASSWORD=  # \u2190 SET A REAL PASSWORD\n`;
    env += `POSTGRES_DB=app_dev\n`;
    env += `DATABASE_URL=postgresql://local_user:YOUR_PASSWORD@postgres:5432/app_dev\n\n`;
  }
  if (state.services.find(s => s.id === 'redis' && s.enabled)) {
    env += `# Redis\nREDIS_URL=redis://redis:6379\n\n`;
  }
  env += `# \u2500\u2500 Add your local secrets below \u2500\u2500\n`;
  env += `# SMTP_PASSWORD=\n# API_KEY=\n`;
  return env;
}
function generateGitignore() {
  return `# Local dev files (generated from examples)\ndocker-compose.yaml\n.env\n\n# Dependencies\nnode_modules/\n\n# Build\ndist/\n.next/\n\n# OS\n.DS_Store\nThumbs.db\n\n# IDE\n.vscode/\n.idea/\n*.swp\n`;
}

// ──── STEP 4: Agents ────
function renderAgentsStep() {
  document.getElementById('agentCount').textContent = `${state.agents.length} Agents`;
  const grid = document.getElementById('agentsGrid');
  grid.innerHTML = state.agents.map((a, i) => `
    <div class="agent-card" style="background:${a.bgColor};border-color:${a.borderColor}">
      <div class="agent-icon" style="background:${a.color}">${esc(a.name).charAt(0)}</div>
      <div class="agent-body">
        <h3>${esc(a.name)}
          <span class="role-badge" style="background:${a.bgColor};border-color:${a.borderColor};color:${a.color}">${esc(a.role)}</span>
        </h3>
        <p>${esc(a.description)}</p>
        <div class="agent-tags">
          ${a.tags.map(t => `<span class="agent-tag" style="background:${a.tagBg};color:${a.tagColor}">${esc(t)}</span>`).join('')}
        </div>
      </div>
      <div class="agent-actions">
        <button class="btn outline small" onclick="editAgent(${i})">✎</button>
        <button class="btn danger" onclick="deleteAgent(${i})">✕</button>
      </div>
    </div>
  `).join('');
}

let editingAgentIdx = -1;

function editAgent(idx) {
  editingAgentIdx = idx;
  const a = state.agents[idx];
  document.getElementById('agentModalTitle').textContent = `${a.name} ${t('js.editAgent')}`;
  document.getElementById('agentEditName').value = a.name;
  document.getElementById('agentEditRole').value = a.role;
  document.getElementById('agentEditDesc').value = a.description;
  document.getElementById('agentEditResp').value = a.responsibilities.join('\n');
  document.getElementById('agentEditInstr').value = a.instructions;
  document.getElementById('agentEditApply').value = a.applyTo.join('\n');
  document.getElementById('agentModal').classList.remove('hidden');
}

function closeAgentModal() {
  document.getElementById('agentModal').classList.add('hidden');
  editingAgentIdx = -1;
}

function saveAgent() {
  const a = editingAgentIdx >= 0 ? state.agents[editingAgentIdx] : null;
  const name = document.getElementById('agentEditName').value;
  const role = document.getElementById('agentEditRole').value;
  const desc = document.getElementById('agentEditDesc').value;
  const resp = document.getElementById('agentEditResp').value.split('\n').filter(Boolean);
  const instr = document.getElementById('agentEditInstr').value;
  const apply = document.getElementById('agentEditApply').value.split('\n').filter(Boolean);

  if (a) {
    Object.assign(a, { name, role, description: desc, responsibilities: resp, instructions: instr, applyTo: apply });
  } else {
    state.agents.push({
      id: name.toLowerCase().replace(/\s+/g, '-'), name, role,
      color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#D1D5DB',
      tagBg: '#F3F4F6', tagColor: '#6B7280',
      description: desc, tags: [role],
      responsibilities: resp, instructions: instr, applyTo: apply
    });
  }
  closeAgentModal();
  renderAgentsStep();
}

function deleteAgent(idx) {
  if (confirm(`Agent "${state.agents[idx].name}" ${t('js.confirmDeleteAgent')}`)) {
    state.agents.splice(idx, 1);
    renderAgentsStep();
  }
}

function addAgent() {
  editingAgentIdx = -1;
  document.getElementById('agentModalTitle').textContent = t('js.newAgent');
  document.getElementById('agentEditName').value = '';
  document.getElementById('agentEditRole').value = '';
  document.getElementById('agentEditDesc').value = '';
  document.getElementById('agentEditResp').value = '';
  document.getElementById('agentEditInstr').value = '';
  document.getElementById('agentEditApply').value = '**/*';
  document.getElementById('agentModal').classList.remove('hidden');
}

// ──── STEP 5: Instructions ────
function renderInstructionsStep() {
  const list = document.getElementById('instructionsList');
  list.innerHTML = state.instructions.map((instr, i) => {
    const isCustom = !instr.isDefault;
    return `
      <div class="instr-card ${isCustom ? 'custom' : ''}">
        <div class="instr-bar ${isCustom ? 'purple' : 'green'}"></div>
        <div class="instr-check ${isCustom ? 'purple' : 'green'}">✓</div>
        <div class="instr-body">
          <h4>${esc(instr.title)}
            <span class="badge ${isCustom ? 'purple' : 'green'}">${isCustom ? 'custom' : 'default'}</span>
          </h4>
          <p>${esc(instr.description)}</p>
        </div>
        <button class="btn outline small" onclick="editInstruction(${i})">✎</button>
        ${isCustom ? `<button class="btn danger" onclick="deleteInstruction(${i})">✕</button>` : ''}
        <div class="instr-toggle on">AN</div>
      </div>
    `;
  }).join('');
  renderInstructionsPreview();
}

let editingInstrIdx = -1;

function editInstruction(idx) {
  editingInstrIdx = idx;
  const instr = state.instructions[idx];
  document.getElementById('instrModalTitle').textContent = `"${instr.title}" ${t('js.editBlock')}`;
  document.getElementById('instrEditTitle').value = instr.title;
  document.getElementById('instrEditDesc').value = instr.description;
  document.getElementById('instrModal').classList.remove('hidden');
}

function closeInstrModal() {
  document.getElementById('instrModal').classList.add('hidden');
  editingInstrIdx = -1;
}

function saveInstruction() {
  const title = document.getElementById('instrEditTitle').value;
  const desc = document.getElementById('instrEditDesc').value;
  if (editingInstrIdx >= 0) {
    state.instructions[editingInstrIdx].title = title;
    state.instructions[editingInstrIdx].description = desc;
  } else {
    state.instructions.push({ id: title.toLowerCase().replace(/\s+/g, '-'), title, description: desc, isDefault: false, enabled: true });
  }
  closeInstrModal();
  renderInstructionsStep();
}

function deleteInstruction(idx) {
  state.instructions.splice(idx, 1);
  renderInstructionsStep();
}

function addInstruction() {
  editingInstrIdx = -1;
  document.getElementById('instrModalTitle').textContent = t('instr.add');
  document.getElementById('instrEditTitle').value = '';
  document.getElementById('instrEditDesc').value = '';
  document.getElementById('instrModal').classList.remove('hidden');
}

function renderInstructionsPreview() {
  const pre = document.getElementById('instructionsPreview');
  pre.textContent = generateCopilotInstructions();
}

function switchInstrTab(el, tab) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const pre = document.getElementById('instructionsPreview');
  if (tab === 'agents') {
    pre.textContent = generateAgentsSummaryMd();
  } else {
    pre.textContent = generateCopilotInstructions();
  }
}

function generateAgentsSummaryMd() {
  const name = state.project.name || 'my-project';
  let md = `# ${name} Agents\n\n`;
  md += `| Agent | Role | Scope |\n|-------|------|-------|\n`;
  state.agents.forEach(a => {
    md += `| ${a.name} | ${a.role} | ${a.applyTo.join(', ')} |\n`;
  });
  md += `\n## How it works\n\n`;
  md += `Each agent has:\n`;
  md += `- **Accountability** — Clear ownership of a domain\n`;
  md += `- **Responsibilities** — What the agent does\n`;
  md += `- **Instructions** — Rules the agent follows\n`;
  md += `- **applyTo** — File patterns the agent operates on\n\n`;
  md += `The **Orchestrator** coordinates all agents and delegates tasks.\n\n`;
  md += `## Agent Files\n\n`;
  state.agents.forEach(a => {
    md += `- \`.github/agents/${a.id}.agent.md\`\n`;
  });
  return md;
}

function generateCopilotInstructions() {
  const name = state.project.name || 'my-project';
  const lang = state.project.language || 'TypeScript / Node.js';
  const desc = state.project.description || '';
  let md = `# Copilot Instructions for ${name}\n\n`;
  md += `## Project\n- **Name:** ${name}\n- **Language:** ${lang}\n- **Description:** ${desc}\n\n`;
  md += `## Instructions\n\n`;
  state.instructions.filter(i => i.enabled).forEach(i => {
    md += `### ${i.title}\n${i.description}\n\n`;
  });
  if (state.freeInstructions) {
    md += `### Additional\n${state.freeInstructions}\n\n`;
  }
  md += `## Docker & Environment\nFollow the docker setup standard. See init-local.sh.\n\n`;
  md += `## Agents\n`;
  state.agents.forEach(a => { md += `- **${a.name}** — ${a.role}\n`; });
  return md;
}

// ──── STEP 6: MCP Servers ────
function renderMcpStep() {
  // Render suggestion chips grouped by category
  const chips = document.getElementById('mcpSuggestions');
  chips.innerHTML = MCP_CATEGORIES.map(cat => {
    const catMcps = DEFAULT_MCPS.filter(m => m.category === cat.id);
    if (catMcps.length === 0) return '';
    const label = cat[currentLang] || cat.de;
    return `<div class="mcp-category">
      <div class="mcp-category-label">${label}</div>
      <div class="chip-row">${catMcps.map(m => {
        const active = state.mcpServers.some(s => s.id === m.id);
        return `<div class="chip ${active ? 'active' : ''}" onclick="toggleMcpSuggestion('${m.id}')" title="${esc(m.description)}">${esc(m.name)}</div>`;
      }).join('')}</div>
    </div>`;
  }).join('');

  // Render active servers list
  const list = document.getElementById('mcpList');
  if (state.mcpServers.length === 0) {
    list.innerHTML = `<p class="empty-hint" style="color:var(--text-secondary);text-align:center;padding:24px 0;">${t('mcp.none')}</p>`;
  } else {
    list.innerHTML = state.mcpServers.map((m, i) => {
      const isDefault = DEFAULT_MCPS.some(d => d.id === m.id);
      return `
        <div class="instr-card">
          <div class="instr-bar ${isDefault ? 'green' : 'purple'}"></div>
          <div class="instr-check ${isDefault ? 'green' : 'purple'}">⚡</div>
          <div class="instr-body">
            <h4>${esc(m.name)} <span class="badge ${isDefault ? 'green' : 'purple'}">${isDefault ? 'popular' : 'custom'}</span></h4>
            <p style="font-family:monospace;font-size:12px;color:var(--text-secondary)">${esc(m.command)}</p>
            ${m.description ? `<p style="margin-top:4px">${esc(m.description)}</p>` : ''}
          </div>
          <button class="btn danger" onclick="removeMcp(${i})">✕</button>
        </div>`;
    }).join('');
  }

  // Update badge
  document.getElementById('mcpCount').textContent = `${state.mcpServers.length} MCPs`;
}

function toggleMcpSuggestion(id) {
  const idx = state.mcpServers.findIndex(s => s.id === id);
  if (idx >= 0) {
    state.mcpServers.splice(idx, 1);
  } else {
    const tpl = DEFAULT_MCPS.find(d => d.id === id);
    if (tpl) state.mcpServers.push({ ...tpl, enabled: true });
  }
  renderMcpStep();
}

function removeMcp(idx) {
  state.mcpServers.splice(idx, 1);
  renderMcpStep();
}

function addMcp() {
  document.getElementById('mcpModalTitle').textContent = t('modal.mcp.title');
  document.getElementById('mcpEditName').value = '';
  document.getElementById('mcpEditCommand').value = '';
  document.getElementById('mcpEditDesc').value = '';
  document.getElementById('mcpModal').classList.remove('hidden');
}

function closeMcpModal() {
  document.getElementById('mcpModal').classList.add('hidden');
}

function saveMcp() {
  const name = document.getElementById('mcpEditName').value.trim();
  const command = document.getElementById('mcpEditCommand').value.trim();
  const description = document.getElementById('mcpEditDesc').value.trim();
  if (!name || !command) return;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  state.mcpServers.push({ id, name, command, description, enabled: true });
  closeMcpModal();
  renderMcpStep();
}

function generateMcpJson() {
  const servers = {};
  state.mcpServers.forEach(m => {
    const parts = m.command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    servers[m.id] = { type: 'stdio', command: cmd, args };
  });
  return JSON.stringify({ servers }, null, 2);
}

// ──── STEP 7: Review ────
function renderReviewStep() {
  saveCurrentState();
  const files = generateFileList();
  document.getElementById('totalFiles').textContent = files.length;
  document.getElementById('totalAgents').textContent = state.agents.length;
  document.getElementById('totalInstructions').textContent = state.instructions.length;

  // File tree
  const tree = document.getElementById('fileTree');
  tree.innerHTML = generateFileTreeHTML(files);

  // Target info
  const target = document.getElementById('targetInfo');
  if (state.repo.mode === 'local') {
    target.innerHTML = `<strong>📁 ${t('js.localDownload')}</strong><p>${files.length} ${t('js.filesAsZip')}</p>`;
  } else {
    const commitMsg = 'chore: initial repo setup via Spec-2-Start';
    target.innerHTML = `<strong>✓ GitHub: ${esc(state.repo.name)}</strong>
      <p>Branch: ${esc(state.repo.branch || 'main')} · Commit: "${commitMsg}"</p>
      <p>${files.length} ${t('js.filesCreatedOrUpdated')}</p>`;
  }

  // Preview tabs
  const tabs = document.getElementById('finalPreviewTabs');
  tabs.innerHTML = files.slice(0, 5).map((f, i) => {
    const name = f.path.split('/').pop();
    return `<button class="tab ${i === 0 ? 'active' : ''}" onclick="previewFile(this, ${i})">${name}</button>`;
  }).join('');

  // Preview first file
  previewFileContent(0);
}

function generateFileList() {
  const files = [];
  // copilot-instructions
  files.push({ path: '.github/copilot-instructions.md', content: generateCopilotInstructions() });
  // Agent files
  state.agents.forEach(a => {
    files.push({ path: `.github/agents/${a.id}.agent.md`, content: generateAgentMd(a) });
  });
  // Docker
  files.push({ path: 'docker-compose.yaml-example', content: generateComposeYaml() });
  files.push({ path: '.env-example', content: state.envContent || generateEnvContent() });
  files.push({ path: '.gitignore', content: generateGitignore() });
  // Docs
  files.push({ path: 'README.md', content: generateReadme() });
  files.push({ path: 'Architecture.md', content: state.architecture.markdown || '' });
  files.push({ path: 'executed-prompts.md', content: generateExecutedPrompts() });
  // Init script
  files.push({ path: 'init-local.sh', content: generateInitScript() });
  // MCP config
  if (state.mcpServers.length > 0) {
    files.push({ path: '.vscode/mcp.json', content: generateMcpJson() });
  }
  return files;
}

function generateAgentMd(a) {
  let md = `---\nname: ${a.id}\ndescription: |\n  ${a.description}\ntools:\n  - codebase\n  - run_in_terminal\n---\n\n`;
  md += `# ${a.name}\n\n## Accountability\n**Role:** ${a.role}\n**Scope:** ${a.applyTo.join(', ')}\n\n`;
  md += `## Responsibilities\n`;
  a.responsibilities.forEach(r => { md += `- ${r}\n`; });
  md += `\n## Instructions\n${a.instructions}\n\n`;
  md += `## applyTo\n`;
  a.applyTo.forEach(p => { md += `  - "${p}"\n`; });
  return md;
}

function generateReadme() {
  const name = state.project.name || 'my-project';
  const desc = state.project.description || '';
  let md = `# ${name}\n\n${desc}\n\n`;
  md += `## Quick Start\n\n\`\`\`bash\nbash init-local.sh\ndocker compose up -d\nnpm install\nnpm run dev\n\`\`\`\n\n`;
  md += `## Agents\n\n`;
  state.agents.forEach(a => { md += `- **${a.name}** (${a.role})\n`; });
  md += `\nSee \`.github/agents/\` for definitions.\n`;
  return md;
}

function generateExecutedPrompts() {
  const ts = new Date().toISOString();
  return `# Executed Prompts\n\n| Timestamp | Agent | Action | Files Changed |\n|-----------|-------|--------|---------------|\n| ${ts} | Spec-2-Start | Initial repo setup | All files |\n`;
}

function generateInitScript() {
  let sh = `#!/bin/bash\nset -e\necho "Initializing local development environment..."\n\n`;
  sh += `if [ ! -f "docker-compose.yaml" ]; then\n  echo "Creating docker-compose.yaml from example..."\n`;
  sh += `  { echo "# WARNING: only for local development"; cat docker-compose.yaml-example; } > docker-compose.yaml\n  echo "Done"\nfi\n\n`;
  sh += `if [ ! -f ".env" ]; then\n  echo "Creating .env from example..."\n`;
  sh += `  { echo "# WARNING: only for local development"; cat .env-example; } > .env\n  echo "Done"\nfi\n\n`;
  sh += `echo "Local environment ready! Run: docker compose up -d"\n`;
  return sh;
}

function generateFileTreeHTML(files) {
  const dirs = {};
  files.forEach(f => {
    const parts = f.path.split('/');
    let current = dirs;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current['__file_' + parts[parts.length - 1]] = true;
  });

  function renderDir(obj, prefix = '') {
    let html = '';
    const keys = Object.keys(obj).sort((a, b) => {
      const aDir = !a.startsWith('__file_');
      const bDir = !b.startsWith('__file_');
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.localeCompare(b);
    });
    keys.forEach(key => {
      if (key.startsWith('__file_')) {
        const name = key.replace('__file_', '');
        html += `${prefix}<span class="file">${esc(name)}</span> <span class="new-badge">new</span>\n`;
      } else {
        html += `${prefix}<span class="dir">📁 ${esc(key)}/</span>\n`;
        html += renderDir(obj[key], prefix + '  ');
      }
    });
    return html;
  }
  return `<pre>${renderDir(dirs)}</pre>`;
}

let generatedFiles = [];

function previewFile(el, idx) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  previewFileContent(idx);
}

function previewFileContent(idx) {
  generatedFiles = generateFileList();
  const pre = document.getElementById('finalPreview');
  if (generatedFiles[idx]) {
    pre.textContent = generatedFiles[idx].content;
  }
}

// ──── ACTIONS ────
function copyPreview(id, btn) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = t('js.copied');
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

// ── Status bar helpers ──
function showStatus(msg, type) {
  const el = document.getElementById('pushStatus');
  el.className = `push-status ${type}`;
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

function hideStatus() {
  document.getElementById('pushStatus').classList.add('hidden');
}

// ══════════════════════════
// DOWNLOAD ZIP (client-side)
// ══════════════════════════
async function downloadZip() {
  if (typeof JSZip === 'undefined') {
    alert(t('js.jszipFail'));
    return;
  }
  showStatus(t('js.zipGenerating'), 'info');
  const files = generateFileList();
  const zip = new JSZip();
  const folderName = state.project.name || 'spec2start-output';

  files.forEach(f => {
    zip.file(f.path, f.content);
  });

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus(`✅ ${files.length} ${t('js.zipDone')} <strong>${folderName}.zip</strong> ${t('js.zipDownloaded')}`, 'success');
  } catch (err) {
    showStatus(`${t('js.zipError')} ${esc(err.message)}`, 'error');
  }
}

// ══════════════════════════
// PUSH TO GITHUB (REST API)
// ══════════════════════════
async function pushToRepo() {
  const token = state.repo.token;
  if (!token) {
    showStatus(t('js.noToken'), 'error');
    return;
  }

  const files = generateFileList();
  const repoName = state.repo.name;  // "owner/repo"
  const branch = state.repo.branch || 'main';

  // Validate repo format
  if (!repoName.includes('/')) {
    showStatus(t('js.repoFormat'), 'error');
    return;
  }

  const btn = document.getElementById('pushBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Pushing...';

  try {
    // Step 1: If mode is 'new', create the repo first
    if (state.repo.mode === 'new') {
      showStatus(t('js.creatingRepo'), 'info');
      const createResp = await ghApi(`/user/repos`, token, 'POST', {
        name: repoName.includes('/') ? repoName.split('/')[1] : repoName,
        private: state.repo.visibility === 'private',
        auto_init: true,
        description: state.project.description || 'Created by Spec-2-Start'
      });
      if (!createResp.ok) {
        const err = await createResp.json();
        throw new Error(err.message || t('js.repoCreateFail'));
      }
      const repoData = await createResp.json();
      state.repo.name = repoData.full_name;
      // Wait a moment for GitHub to initialize
      await sleep(2000);
    }

    const owner = state.repo.name.split('/')[0];
    const repo = state.repo.name.split('/')[1];

    // Step 2: Get the current commit SHA of the branch
    showStatus(`${t('js.connecting')} ${esc(state.repo.name)}...`, 'info');
    const refResp = await ghApi(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
    if (!refResp.ok) throw new Error(`Branch "${branch}" ${t('js.branchNotFound')}`);
    const refData = await refResp.json();
    const baseSha = refData.object.sha;

    // Step 3: Get the base tree
    const commitResp = await ghApi(`/repos/${owner}/${repo}/git/commits/${baseSha}`, token);
    const commitData = await commitResp.json();
    const baseTreeSha = commitData.tree.sha;

    // Step 4: Create blobs for each file
    showStatus(`${t('js.creatingFiles')} ${files.length} ${t('js.filesLabel')}`, 'info');
    const treeItems = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      showStatus(`📡 [${i + 1}/${files.length}] ${esc(f.path)}`, 'info');
      const blobResp = await ghApi(`/repos/${owner}/${repo}/git/blobs`, token, 'POST', {
        content: f.content,
        encoding: 'utf-8'
      });
      const blobData = await blobResp.json();
      treeItems.push({
        path: f.path,
        mode: f.path.endsWith('.sh') ? '100755' : '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    // Step 5: Create a new tree
    showStatus(t('js.creatingCommit'), 'info');
    const treeResp = await ghApi(`/repos/${owner}/${repo}/git/trees`, token, 'POST', {
      base_tree: baseTreeSha,
      tree: treeItems
    });
    const treeData = await treeResp.json();

    // Step 6: Create the commit
    const newCommitResp = await ghApi(`/repos/${owner}/${repo}/git/commits`, token, 'POST', {
      message: 'chore: initial repo setup via Spec-2-Start',
      tree: treeData.sha,
      parents: [baseSha]
    });
    const newCommitData = await newCommitResp.json();

    // Step 7: Update the branch reference
    await ghApi(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, 'PATCH', {
      sha: newCommitData.sha
    });

    const repoUrl = `https://github.com/${owner}/${repo}`;
    showStatus(
      `✅ <strong>${files.length} ${t('js.pushDone')}</strong> <a href="${repoUrl}" target="_blank" rel="noopener">${esc(state.repo.name)}</a><br>` +
      `<span class="progress-text">Branch: ${esc(branch)} · Commit: ${newCommitData.sha.substring(0, 7)}</span>`,
      'success'
    );
  } catch (err) {
    showStatus(`${t('js.pushFailed')} ${esc(err.message)}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '&#128640; Push to GitHub';
  }
}

// ── GitHub API helper ──
async function ghApi(path, token, method, body) {
  const opts = {
    method: method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return fetch(`https://api.github.com${path}`, opts);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════
// I18N TRANSLATION SYSTEM
// ═══════════════════════════
const I18N = {
  de: {
    // Step 0 — Hero & Repo
    'hero.title': 'Neues Repo einrichten',
    'hero.desc': 'Dieser Wizard führt dich Schritt für Schritt durch die Erstellung deiner Repo-Standards.',
    'repo.gh.desc': 'Direkt in ein bestehendes Repo schreiben',
    'repo.gh.url': 'Repository URL oder Owner/Name',
    'repo.token.hint': 'Benötigt für Push.',
    'repo.token.create': 'Token erstellen ↗',
    'repo.gh.connect': 'Repository verbinden',
    'repo.new.title': 'Neues Repo erstellen',
    'repo.new.desc': 'Leeres GitHub Repo anlegen und Standards einrichten',
    'repo.token.hint2': 'Benötigt für Repo-Erstellung.',
    'repo.new.btn': 'Repo erstellen & starten',
    'repo.local.title': 'Nur lokal generieren',
    'repo.local.desc': 'Dateien als ZIP herunterladen, ohne GitHub-Anbindung',
    'repo.hint.label': 'Tipp:',
    'repo.hint.text': 'Du kannst jederzeit zwischen den Schritten zurücknavigieren. Nichts wird geschrieben bis du im letzten Schritt bestätigt hast.',
    // Step 1 — Project
    'proj.title': 'Was baust du?',
    'proj.subtitle': 'Beschreibe dein Projekt in einfacher Sprache. Die KI erstellt daraus die technische Architektur.',
    'proj.placeholder': 'Bitte beschreibe dein Projekt in einfacher Sprache...',
    'proj.templates': 'SCHNELLSTART-VORLAGEN',
    'proj.name': 'Projektname',
    'proj.lang': 'Primäre Sprache',
    'proj.analyze': 'Analysieren ›',
    'proj.side.title': 'Was passiert als nächstes?',
    'proj.side.s1': 'KI analysiert deine Beschreibung',
    'proj.side.s2': 'Erzeugt technische Architektur',
    'proj.side.s3': 'Schlägt Stack & Services vor',
    'proj.side.s4': 'Du kannst alles anpassen',
    'proj.side.terms': 'ERKANNTE BEGRIFFE',
    'proj.side.stack': 'VORAUSSICHTLICHER STACK',
    // Step 2 — Architecture
    'arch.title': 'Technische Architektur',
    'arch.badge': 'KI-generiert',
    'arch.regen': '↻ Neu generieren',
    'arch.subtitle': 'Basierend auf deiner Beschreibung. Klicke auf einen Block zum Ändern.',
    'arch.addBlock': '+ Block hinzufügen',
    'arch.suggestions': 'SCHNELLAUSWAHL',
    'arch.preview': 'Architecture.md Vorschau',
    'arch.editable': 'editierbar',
    // Step 3 — Docker
    'docker.title': 'Docker & Environment',
    'docker.subtitle': 'Konfiguriere docker-compose Services und Environment-Variablen',
    'docker.rules.title': 'Standard-Regeln (automatisch angewendet)',
    'docker.rules.r1': 'docker-compose.yaml-example + .env-example = immer vollständig',
    'docker.rules.r2': 'Lokale Kopien via .gitignore geschützt',
    'docker.rules.r3': 'Clone-Skript erstellt lokale Dateien automatisch',
    'docker.services': 'SERVICES',
    'docker.addService': '+ Service hinzufügen',
    'docker.envVars': '.env-example Variablen',
    'docker.volumes': 'LOKALE VOLUME-PFADE',
    'docker.volumesDesc': 'Host-Pfade für Named Volumes (nur für lokale docker-compose.yaml)',
    'docker.preview': 'LIVE VORSCHAU',
    'docker.tab.compose': 'compose-example',
    'docker.next': 'Agents konfigurieren ›',
    'tabs.hint': '▼ Klicke die Tabs um verschiedene Dateien zu sehen',
    'btn.copy': 'Kopieren',
    // Step 4 — Agents
    'agents.subtitle': 'Definiere dein AI-Team. Jeder Agent hat eine klare Accountability.',
    'agents.add': '+ Custom Agent hinzufügen',
    'agents.info': 'Jeder Agent erzeugt eine .agent.md Datei',
    'agents.info2': 'mit: Accountability · Responsibilities · Instructions · Tools · applyTo',
    // Step 5 — Instructions
    'instr.title': 'Projekt-Instructions',
    'instr.subtitle': 'Regeln die IMMER gelten. Werden in copilot-instructions.md geschrieben.',
    'instr.add': '+ Neue Instruction hinzufügen',
    'instr.free': 'Zusätzliche Freitext-Instructions',
    'instr.freePh': 'Schreibe hier weitere Regeln die immer gelten sollen...',
    'instr.next': 'MCP Servers ›',
    // Step 6 — MCP
    'mcp.title': 'MCP Servers',
    'mcp.subtitle': 'Konfiguriere Model Context Protocol Server für dein Projekt. Diese werden in .vscode/mcp.json gespeichert.',
    'mcp.hint.title': 'Was sind MCP Server?',
    'mcp.hint.desc': 'MCP Server erweitern Copilot/AI mit zusätzlichen Tools — z.B. shadcn/ui Komponenten, Datenbank-Zugriff, API-Dokumentation oder Design-Systeme.',
    'mcp.popular': 'BELIEBTE MCP SERVER',
    'mcp.active': 'AKTIVE MCP SERVER',
    'mcp.add': '+ MCP Server hinzufügen',
    'mcp.next': 'Review & Generate ›',
    'mcp.none': 'Noch keine MCP Server hinzugefügt. Klicke oben auf einen Vorschlag oder füge einen eigenen hinzu.',
    'mcp.cat.ui': '🎨 UI & Design',
    'mcp.cat.data': '🗄️ Datenbanken & Daten',
    'mcp.cat.dev': '🛠️ Entwicklung & Tools',
    'mcp.cat.test': '🧪 Testing & QA',
    'mcp.cat.docs': '📚 Docs & Wissen',
    'mcp.cat.infra': '☁️ Infra & DevOps',
    'mcp.cat.ai': '🧠 AI & Reasoning',
    'mcp.cat.api': '🔌 APIs & Services',
    'mcp.namePrompt': 'MCP Server Name:',
    'mcp.commandPrompt': 'Befehl (z.B. npx -y @scope/mcp-server):',
    'mcp.descPrompt': 'Beschreibung (optional):',
    // Step 7 — Review
    'review.title': 'Review & Generieren',
    'review.subtitle': 'Prüfe alle generierten Dateien bevor sie ins Repo geschrieben werden.',
    'review.files': 'Dateien',
    'review.tree': 'DATEIBAUM',
    'review.target': 'ZIEL',
    'review.preview': 'DATEI-VORSCHAU',
    'review.dlSmall': '↓ Download .zip',
    // Modals
    'modal.agent.title': 'Agent bearbeiten',
    'modal.agent.desc': 'Beschreibung',
    'modal.arch.title': 'Block bearbeiten',
    'modal.arch.layer': 'Layer / Titel',
    'modal.arch.tech': 'Technologie',
    'modal.arch.detail': 'Details',
    'modal.instr.title': 'Instruction bearbeiten',
    'modal.instr.titleLabel': 'Titel',
    'modal.instr.desc': 'Beschreibung',
    'btn.cancel': 'Abbrechen',
    'btn.save': 'Speichern',
    'btn.delete': 'Löschen',
    // MCP Modal
    'modal.mcp.title': 'MCP Server hinzufügen',
    'modal.mcp.name': 'Name',
    'modal.mcp.command': 'Befehl',
    'modal.mcp.desc': 'Beschreibung (optional)',
    // JS-generated strings
    'js.editBlock': 'bearbeiten',
    'js.newBlock': 'Neuen Block hinzufügen',
    'js.confirmDelete': 'wirklich löschen?',
    'js.editAgent': 'bearbeiten',
    'js.newAgent': 'Neuen Agent erstellen',
    'js.confirmDeleteAgent': 'wirklich löschen?',
    'js.copied': '✓ Kopiert',
    'js.zipGenerating': '📦 ZIP wird generiert...',
    'js.zipDone': 'Dateien als',
    'js.zipDownloaded': 'heruntergeladen',
    'js.zipError': '❌ ZIP-Fehler:',
    'js.noToken': '❌ Kein GitHub Token gesetzt. Gehe zurück zu Schritt 0 und gib deinen Token ein.',
    'js.repoFormat': '❌ Repo muss im Format <code>owner/repo</code> sein.',
    'js.creatingRepo': '📡 Erstelle neues Repository...',
    'js.connecting': '📡 Verbinde mit',
    'js.creatingFiles': '📡 Erstelle',
    'js.filesLabel': 'Dateien...',
    'js.creatingCommit': '📡 Erstelle Commit...',
    'js.pushDone': 'Dateien erfolgreich gepusht!',
    'js.pushFailed': '❌ Push fehlgeschlagen:',
    'js.stackPending': 'Stack wird nach Analyse vorgeschlagen',
    'js.noVolumes': 'Keine Volumes aktiv',
    'js.jszipFail': 'JSZip konnte nicht geladen werden. Bitte prüfe deine Internetverbindung.',
    'js.repoCreateFail': 'Repo konnte nicht erstellt werden',
    'js.branchNotFound': 'nicht gefunden',
    'js.serviceNamePrompt': 'Service-Name (z.B. mailhog, adminer):',
    'js.serviceImagePrompt': 'Docker Image:',
    'js.servicePortPrompt': 'Port:',
    'js.localDownload': 'Lokaler Download',
    'js.filesAsZip': 'Dateien als ZIP herunterladen',
    'js.filesCreatedOrUpdated': 'Dateien werden erstellt oder aktualisiert'
  },
  en: {
    'hero.title': 'Set Up New Repo',
    'hero.desc': 'This wizard guides you step by step through the creation of your repo standards.',
    'repo.gh.desc': 'Write directly into an existing repo',
    'repo.gh.url': 'Repository URL or Owner/Name',
    'repo.token.hint': 'Required for push.',
    'repo.token.create': 'Create token ↗',
    'repo.gh.connect': 'Connect repository',
    'repo.new.title': 'Create new repo',
    'repo.new.desc': 'Create an empty GitHub repo and set up standards',
    'repo.token.hint2': 'Required for repo creation.',
    'repo.new.btn': 'Create repo & start',
    'repo.local.title': 'Generate locally only',
    'repo.local.desc': 'Download files as ZIP, without GitHub connection',
    'repo.hint.label': 'Tip:',
    'repo.hint.text': 'You can navigate between steps at any time. Nothing is written until you confirm in the last step.',
    'proj.title': 'What are you building?',
    'proj.subtitle': 'Describe your project in plain language. The AI will create the technical architecture from it.',
    'proj.placeholder': 'Please describe your project in plain language...',
    'proj.templates': 'QUICKSTART TEMPLATES',
    'proj.name': 'Project name',
    'proj.lang': 'Primary language',
    'proj.analyze': 'Analyze ›',
    'proj.side.title': 'What happens next?',
    'proj.side.s1': 'AI analyzes your description',
    'proj.side.s2': 'Generates technical architecture',
    'proj.side.s3': 'Suggests stack & services',
    'proj.side.s4': 'You can customize everything',
    'proj.side.terms': 'DETECTED TERMS',
    'proj.side.stack': 'ESTIMATED STACK',
    'arch.title': 'Technical Architecture',
    'arch.badge': 'AI-generated',
    'arch.regen': '↻ Regenerate',
    'arch.subtitle': 'Based on your description. Click a block to edit.',
    'arch.addBlock': '+ Add block',
    'arch.suggestions': 'QUICK SELECT',
    'arch.preview': 'Architecture.md Preview',
    'arch.editable': 'editable',
    'docker.title': 'Docker & Environment',
    'docker.subtitle': 'Configure docker-compose services and environment variables',
    'docker.rules.title': 'Standard rules (applied automatically)',
    'docker.rules.r1': 'docker-compose.yaml-example + .env-example = always complete',
    'docker.rules.r2': 'Local copies protected via .gitignore',
    'docker.rules.r3': 'Clone script creates local files automatically',
    'docker.services': 'SERVICES',
    'docker.addService': '+ Add service',
    'docker.envVars': '.env-example Variables',
    'docker.volumes': 'LOCAL VOLUME PATHS',
    'docker.volumesDesc': 'Host paths for named volumes (only for local docker-compose.yaml)',
    'docker.preview': 'LIVE PREVIEW',
    'docker.tab.compose': 'compose-example',
    'docker.next': 'Configure agents ›',
    'tabs.hint': '▼ Click the tabs to see different files',
    'btn.copy': 'Copy',
    'agents.subtitle': 'Define your AI team. Each agent has a clear accountability.',
    'agents.add': '+ Add custom agent',
    'agents.info': 'Each agent generates an .agent.md file',
    'agents.info2': 'with: Accountability · Responsibilities · Instructions · Tools · applyTo',
    'instr.title': 'Project Instructions',
    'instr.subtitle': 'Rules that ALWAYS apply. Written to copilot-instructions.md.',
    'instr.add': '+ Add new instruction',
    'instr.free': 'Additional free-text instructions',
    'instr.freePh': 'Write additional rules that should always apply...',
    'instr.next': 'MCP Servers ›',
    // Step 6 — MCP
    'mcp.title': 'MCP Servers',
    'mcp.subtitle': 'Configure Model Context Protocol servers for your project. These are stored in .vscode/mcp.json.',
    'mcp.hint.title': 'What are MCP servers?',
    'mcp.hint.desc': 'MCP servers extend Copilot/AI with additional tools — e.g. shadcn/ui components, database access, API docs, or design systems.',
    'mcp.popular': 'POPULAR MCP SERVERS',
    'mcp.active': 'ACTIVE MCP SERVERS',
    'mcp.add': '+ Add MCP server',
    'mcp.next': 'Review & Generate ›',
    'mcp.none': 'No MCP servers added yet. Click a suggestion above or add a custom one.',
    'mcp.cat.ui': '🎨 UI & Design',
    'mcp.cat.data': '🗄️ Databases & Data',
    'mcp.cat.dev': '🛠️ Development & Tools',
    'mcp.cat.test': '🧪 Testing & QA',
    'mcp.cat.docs': '📚 Docs & Knowledge',
    'mcp.cat.infra': '☁️ Infra & DevOps',
    'mcp.cat.ai': '🧠 AI & Reasoning',
    'mcp.cat.api': '🔌 APIs & Services',
    'mcp.namePrompt': 'MCP Server Name:',
    'mcp.commandPrompt': 'Command (e.g. npx -y @scope/mcp-server):',
    'mcp.descPrompt': 'Description (optional):',
    // Step 7 — Review
    'review.title': 'Review & Generate',
    'review.subtitle': 'Check all generated files before they are written to the repo.',
    'review.files': 'Files',
    'review.tree': 'FILE TREE',
    'review.target': 'TARGET',
    'review.preview': 'FILE PREVIEW',
    'review.dlSmall': '↓ Download .zip',
    'modal.agent.title': 'Edit agent',
    'modal.agent.desc': 'Description',
    'modal.arch.title': 'Edit block',
    'modal.arch.layer': 'Layer / Title',
    'modal.arch.tech': 'Technology',
    'modal.arch.detail': 'Details',
    'modal.instr.title': 'Edit instruction',
    'modal.instr.titleLabel': 'Title',
    'modal.instr.desc': 'Description',
    'btn.cancel': 'Cancel',
    'btn.save': 'Save',
    'btn.delete': 'Delete',
    // MCP Modal
    'modal.mcp.title': 'Add MCP Server',
    'modal.mcp.name': 'Name',
    'modal.mcp.command': 'Command',
    'modal.mcp.desc': 'Description (optional)',
    'js.editBlock': 'edit',
    'js.newBlock': 'Add new block',
    'js.confirmDelete': 'really delete?',
    'js.editAgent': 'edit',
    'js.newAgent': 'Create new agent',
    'js.confirmDeleteAgent': 'really delete?',
    'js.copied': '✓ Copied',
    'js.zipGenerating': '📦 Generating ZIP...',
    'js.zipDone': 'files as',
    'js.zipDownloaded': 'downloaded',
    'js.zipError': '❌ ZIP error:',
    'js.noToken': '❌ No GitHub token set. Go back to Step 0 and enter your token.',
    'js.repoFormat': '❌ Repo must be in format <code>owner/repo</code>.',
    'js.creatingRepo': '📡 Creating new repository...',
    'js.connecting': '📡 Connecting to',
    'js.creatingFiles': '📡 Creating',
    'js.filesLabel': 'files...',
    'js.creatingCommit': '📡 Creating commit...',
    'js.pushDone': 'files pushed successfully!',
    'js.pushFailed': '❌ Push failed:',
    'js.stackPending': 'Stack will be suggested after analysis',
    'js.noVolumes': 'No active volumes',
    'js.jszipFail': 'JSZip could not be loaded. Please check your internet connection.',
    'js.repoCreateFail': 'Repository could not be created',
    'js.branchNotFound': 'not found',
    'js.serviceNamePrompt': 'Service name (e.g. mailhog, adminer):',
    'js.serviceImagePrompt': 'Docker image:',
    'js.servicePortPrompt': 'Port:',
    'js.localDownload': 'Local Download',
    'js.filesAsZip': 'files as ZIP download',
    'js.filesCreatedOrUpdated': 'files will be created or updated'
  }
};

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.de[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    // For labels with child inputs, only replace the first text node
    const firstChild = el.firstChild;
    if (el.tagName === 'LABEL' && firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      firstChild.textContent = text + ' ';
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  renderStepNav();
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('s2s-lang', lang);
  document.documentElement.lang = lang;
  const sel = document.getElementById('langSelect');
  if (sel) sel.value = lang;
  applyTranslations();
}

// ═══════════════════════════
// THEME SYSTEM
// ═══════════════════════════
function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('s2s-theme', theme);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = theme;
}

// ──── BOOTSTRAP ────
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved preferences
  const savedTheme = localStorage.getItem('s2s-theme') || 'light';
  const savedLang = localStorage.getItem('s2s-lang') || 'de';
  setTheme(savedTheme);
  currentLang = savedLang;
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = savedLang;
  document.documentElement.lang = savedLang;
  init();
  applyTranslations();
});
