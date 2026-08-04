# Website build agents - install and use

Seven Claude Code agents covering a full website project end to end: gathering
requirements, designing the system, building the React app, and hardening and
testing what got built. Built for someone who already knows JavaScript, HTML,
CSS and a little Vue and is learning React along the way.

- discovery - interviews you about the project one question at a time and
  produces the PRD, technical spec, user stories, roadmap and design direction.
  Invoke first, before any other agent. Read only.
- architect - takes discovery's PRD and technical spec and produces the system
  blueprint: architecture, folder structure, database design, API design,
  security plan, SEO strategy, scalability plan. Read only, writes no code.
- frontend-builder - scaffolds the project and builds the visible shell: routes,
  layout, Tailwind, accessibility, forms markup.
- react-specialist - owns React itself. Two modes: BUILD writes components,
  hooks, state and effects. REVIEW audits React code and reports findings with
  severity and file:line, changing nothing.
- security - audits the built codebase against the OWASP Top 10:2025 and patches
  what it finds, with a report of every finding, its severity, and the fix.
- qa - writes the test suites (unit, integration, E2E, accessibility, Lighthouse
  CI) against the patched codebase and wires them into
  .github/workflows/ci.yml.
- react-tutor - explains React in plain language by translating from Vue. Read
  only. It cannot edit your files, by design.

## The pipeline

    discovery -> architect -> frontend-builder -> react-specialist -> security -> qa

react-tutor sits outside this line - invoke it any time you want something
explained instead of built.

## One thing to know first

Claude Code allows only one level of subagent nesting. A subagent cannot call
another subagent. So none of these agents can hand work to the next one
directly, even though several are designed to run in sequence. Your main Claude
Code session is what sequences them - you invoke each in turn.

They coordinate two different ways:

- discovery and architect coordinate through the conversation. Neither has a
  Write tool. discovery ends its output with the line
  `PROJECT READY FOR DEVELOPMENT` after producing five documents in chat -
  paste that output (or the PRD and technical spec sections of it) into your
  next message to architect. architect's output ends with `## Handoff Notes`
  for the agents downstream of it. Save these documents yourself (for example
  to docs/discovery/ and docs/architecture/) if you want them to outlive the
  conversation - neither agent persists them on its own.
- frontend-builder and react-specialist coordinate through a file.
  frontend-builder writes docs/handoff/frontend-to-react.md listing what it
  built and what React work it deliberately left undone. react-specialist reads
  that file when it starts. When React needs a markup change, react-specialist
  writes docs/handoff/react-to-frontend.md going the other way.
- security and qa work directly on the codebase on disk. security patches files
  in place and also prints the full patched contents of everything it changed,
  so you can review the diff. qa writes complete test files and the CI workflow
  directly - feed it the codebase after security has run over it.

## Install

These are global agents, available in every project.

Windows, PowerShell:

    mkdir "$env:USERPROFILE\.claude\agents" -Force
    copy discovery.md        "$env:USERPROFILE\.claude\agents\"
    copy architect.md        "$env:USERPROFILE\.claude\agents\"
    copy frontend-builder.md "$env:USERPROFILE\.claude\agents\"
    copy react-specialist.md "$env:USERPROFILE\.claude\agents\"
    copy security.md         "$env:USERPROFILE\.claude\agents\"
    copy qa.md                "$env:USERPROFILE\.claude\agents\"
    copy react-tutor.md       "$env:USERPROFILE\.claude\agents\"

The full path is C:\Users\<your-username>\.claude\agents\

macOS or Linux, bash or zsh:

    mkdir -p ~/.claude/agents
    cp discovery.md architect.md frontend-builder.md react-specialist.md \
       security.md qa.md react-tutor.md ~/.claude/agents/

The full path is ~/.claude/agents/

## Verify

Start Claude Code in any folder and run:

    /agents

All seven should appear in the list with their descriptions. If one is missing,
its YAML frontmatter is malformed - check that line 1 is exactly three dashes
and that the name field matches the filename without .md.

## Requirements for the project itself

Node 20.19 or newer, or 22.12 or newer. Check with:

    node -v

The agents build with Vite 7, React 19, TypeScript, Tailwind CSS 4, React Router
7 and Vitest. frontend-builder installs all of it on the first run. qa installs
whatever its suites need on first run too - Playwright, @axe-core/playwright,
Supertest, and a Lighthouse CI config - so its first invocation on a fresh
project will take longer and needs network access.

## How to actually use these

A realistic first session, in order. Type these in Claude Code.

1. Work out what you're actually building.

       @discovery I want to build a website for my business.

   Answer its questions one at a time. When it prints
   `PROJECT READY FOR DEVELOPMENT`, keep that output - you need the PRD and
   technical spec sections for the next step.

2. Turn requirements into a blueprint.

       @architect Here is the PRD and technical spec from discovery: <paste>

3. Understand a concept before you use it.

       @react-tutor I know Vue. What is useState actually doing, and why is it
       not the same as ref()?

4. Get a real app on screen, following architect's folder structure. Run this
   in an empty folder.

       @frontend-builder Set up a new Vite + React + TypeScript + Tailwind app
       here, following this folder structure: <paste from architect>. Build a
       header with nav, a Home page, and a Recipes page showing six recipe
       cards. Static data is fine for now.

5. Add the behavior. react-specialist reads the handoff note first.

       @react-specialist BUILD Read docs/handoff/frontend-to-react.md, then make
       the recipes list filterable by a search box and let each card toggle a
       saved state.

6. Get it audited. react-specialist will also have already audited itself in
   step 5 - this is a second pass over the whole tree.

       @react-specialist REVIEW src/ and tell me what a React reviewer would
       flag.

7. Harden it before it ships.

       @security Audit and patch src/ against the OWASP Top 10:2025.

8. Cover it with tests, and wire CI.

       @qa Write the full test suite for this project and wire it into
       .github/workflows/ci.yml.

9. Understand what came out of any of the above, using your own code as the
   example.

       @react-tutor Explain the useEffect in src/routes/Recipes.tsx line by line,
       and tell me where my Vue instinct is wrong about it.

You can also just describe what you want without naming an agent - Claude Code
routes by the description field. Naming the agent with @ is more reliable when
you care which one answers, and matters more now that there are seven of these
competing for a description match.

## Troubleshooting

An agent does not show in /agents. The frontmatter is broken. Line 1 must be
exactly three dashes, name must match the filename, and there must be a closing
line of three dashes before the body.

The wrong agent answers. Name it explicitly with @. With seven agents installed,
descriptions overlap more - "review this" or "check this" can plausibly mean
react-specialist REVIEW or security.

discovery or architect tried to write files. They shouldn't - both are read
only by design. If one attempts it, the invocation likely got itself confused
with a build agent; restate the request without asking it to also "set up" or
"create" anything.

architect wrote application code. Tell it directly: blueprint only, no code.
Its instructions forbid this, but a request phrased as "show me the API" can
pull it toward writing a full route handler instead of the API's shape.

react-tutor tried to write code. It cannot - it has no Write or Edit tool. If it
offers a full implementation in chat, tell it to hand you the invocation for
react-specialist instead.

react-specialist edited files when you wanted a review. Put the word REVIEW in
capitals in your request. That forces the mode.

frontend-builder added a hook or an effect. That is out of its lane. Ask
react-specialist to REVIEW those files and move the logic.

security reported a finding you don't think is real. Ask it to trace the exact
source-to-sink path. Its own rules require this - if it can't show the path, it
should retract the finding, not just tell you.

qa produced stub tests or it.todo. Its instructions explicitly forbid both -
point at the offending file and ask it to complete that suite for real.

## Name collisions

These seven names - discovery, architect, frontend-builder, react-specialist,
security, qa, react-tutor - do not clash with the agents Claude Code ships. If
you already have your own agents using any of these names, or names like
frontend, react-ui, react-reviewer, sec-review or test-writer, all seven of
these still install fine, but requests may route to your existing ones. Name
the agent explicitly with @ when that happens.
