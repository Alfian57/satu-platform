<satu-project-context>
=== project rules ===

# SATU Project Context

SATU (Sistem Aktivitas Talenta Universitas) is a multi-institution collaboration platform for students, campus operators, and, later, recruiters. The current codebase is still a Laravel React starter; planned capabilities must not be described as already implemented.

## AI Entry and Source of Truth

Immediately after this file, read `START_HERE.md`, then `docs/implementation/PROGRESS.md`, then only the active phase file. Do not load every phase.

`START_HERE.md` controls work scope, not product truth. Within its referenced sources, use this precedence:

1. `PRODUCT.md` for durable product truth and non-negotiable boundaries.
2. `docs/product/PRD.md` for requirements, scope, and acceptance criteria.
3. `DESIGN.md` for global visual authority.
4. `docs/ux/` and the matching `.impeccable/surfaces/*.md` brief for UI behavior.
5. `docs/engineering/` for architecture, data, security, and privacy contracts.
6. The active file in `docs/implementation/phases/` and `docs/implementation/TEST_STRATEGY.md` for execution and verification.
7. `docs/governance/DECISIONS.md` for accepted decisions and open gates.
8. `docs/reference/proposal_lomba.md` is historical input, not a runtime specification.

When documents conflict, the earlier source wins. Update the owning source instead of silently overriding it in code.

## Active Phase Workflow

- Work on exactly `current_phase_file` from `docs/implementation/PROGRESS.md` unless the user explicitly changes scope.
- Check the phase prerequisites before editing. Do not skip unmet prerequisites by inventing substitute behavior.
- Read only the phase's `Read Before Work` sources, then follow its deliverables, exclusions, verification, exit criteria, and gate.
- Do not begin the next phase as cleanup or convenience work.
- At a human gate, set the state to `awaiting_approval`, present inspectable evidence, and stop.
- `docs/implementation/PROGRESS.md` is the only phase-status source. Advance it only after all exit criteria pass and any required approval is explicit.
- Finish with the four-line report contract from `START_HERE.md`; omit file lists and raw logs unless needed to explain a failure.

## Product Invariants

- Open registration creates a normal student account only. Privileged roles are assigned through controlled workflows.
- Campus affiliation is separate from account registration and becomes verified through an approved email domain or campus-admin review.
- Tenant-owned data is institution-scoped in queries, policies, jobs, caches, storage, exports, and broadcasts.
- Social Network Analysis measures collaboration opportunity and risk of exclusion. It is not a mental-health diagnosis.
- Do not analyze message content for sentiment, psychological state, or diagnosis.
- Matching is transparent and versioned. Its supported dimensions are `skill_fit`, `project_need`, `availability`, and `connectivity_opportunity`.
- Inclusion signals are restricted to authorized human review. Never expose them to students, teammates, or recruiters.
- Recruiters receive only explicitly visible portfolio projections. They never receive inclusion, private discussion, raw audit, or private evidence data.
- The database is the source of truth. Laravel Reverb delivers authorized realtime deltas after commit.
- Do not invent customers, prices, testimonials, pilot results, benchmarks, or impact claims. Label synthetic demonstration data.

## Architecture Direction

- Target production database: MySQL. SQLite may remain for lightweight local/test use only when behavior stays compatible.
- Use a Laravel modular monolith and existing framework directories. Do not introduce a new architectural base folder without approval.
- Prefer explicit Actions for business operations, Policies for every protected resource, Form Requests for validation/authorization, Jobs for retryable work, and Events for realtime delivery.
- Use named Laravel routes and Wayfinder from React. Do not hardcode backend URLs.
- Use Inertia for initial page state and commands. Use private/presence Reverb channels for workspace deltas.
- Keep external academic, SSO, billing, and notification providers behind contracts.
- Preserve append-only history for validation, consent, inclusion review, and sensitive decisions.

## Database Migrations

- Saat menambah atau mengubah kolom pada tabel yang sudah ada, edit migration tabel tersebut secara langsung.
- Jangan membuat migration tambahan dengan pola `add_*_column_*` untuk perubahan kolom pada tabel yang sudah memiliki migration.
- Buat migration baru hanya untuk tabel baru atau struktur yang belum memiliki migration asal.

## UI/UX Workflow

- Before any UI change, read `PRODUCT.md`, `docs/product/PRD.md`, `DESIGN.md`, `docs/ux/SCREEN_INVENTORY.md`, and the matching surface brief.
- If a new surface has no brief, run `$impeccable shape <surface>`, confirm it, and persist its surface brief before implementation.
- Application surfaces use `Operate`; public portfolio may use `Experience`; landing pages use `Persuade`.
- The visual world is **Buku Besar Kolaborasi**. The Laravel starter, neutral shadcn defaults, and placeholder dashboard are scaffolding, not SATU's identity.
- A local feature inherits `DESIGN.md`; do not create a new visual identity per page.
- Design empty, loading, processing, success, validation, network, reconnect, stale, forbidden, overflow, and destructive states as applicable.
- Meet WCAG 2.2 AA. Preserve keyboard operation, visible focus, semantic structure, reduced motion, text alternatives, and status cues beyond color.
- Write product copy and first-party documentation in Indonesian using the canonical terms in `docs/ux/CONTENT_ACCESSIBILITY.md`.
- Do not use the Unicode em dash character in first-party UI or documentation. Use a period, comma, colon, or parentheses according to the sentence meaning.
- Every enabled clickable or tappable target must show a pointer cursor. Disabled targets must show a not-allowed cursor.
- Never use labels such as “vulnerable”, “isolated”, or mental-health inference in student/recruiter UI.
- After the first real SATU surface establishes tokens and components, run `$impeccable document` to replace the seed `DESIGN.md`.
- Before UI release, use scoped `$impeccable audit`, `$impeccable harden`, and `$impeccable polish`.
- Jika surface membutuhkan asset bitmap dan belum ada asset yang disetujui, agent boleh membuat asset gambar sendiri. Ikuti kebijakan asset pada `docs/ux/README.md`.

## Documentation Maintenance

- Product change: update `PRODUCT.md`.
- Requirement/scope change: update PRD and traceability.
- Global visual change: update `DESIGN.md`.
- Route-specific UX change: update its surface brief and relevant UX document.
- Entity/event/permission/integration change: update the relevant engineering document.
- Roadmap, phase, progress, or release-gate change: update `docs/implementation/`.
- Governance decision: update `docs/governance/DECISIONS.md` and security/privacy documentation.
- Phase state or completion: update only `docs/implementation/PROGRESS.md`.

Do not close an `open` decision in `docs/governance/DECISIONS.md` by assumption.

## Verification

- Every runtime change requires programmatic tests.
- Use Pest feature tests by default, unit tests for pure calculations, and browser tests for critical JavaScript/user flows.
- Test cross-tenant denial, policies, score version/explanation, Reverb channel authorization, restricted serialization, and recovery states where relevant.
- Run the narrowest affected test first, then formatting/static/frontend checks warranted by the change.
- Jangan menjalankan `npm run build` kecuali pengguna memintanya secara eksplisit atau build diperlukan untuk mendiagnosis error Vite. Untuk perubahan biasa, lint, typecheck yang relevan, dan test yang terdampak sudah cukup.
- Documentation changes must pass Prettier, internal-link review, surface-brief resolution, and `git diff --check`.
- A phase is not complete until every verification and exit criterion in its active phase file passes.

</satu-project-context>

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain: don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
    - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>
