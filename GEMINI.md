# Directus Project

## Project Overview

This repository contains the source code for Directus, a real-time API and App dashboard for managing SQL database content. It is a monorepo managed with pnpm workspaces, containing the following main packages:

* **api:** The backend API, built with Node.js, Express, and TypeScript. It uses Knex.to interact with the database.
* **app:** The frontend application, built with Vue.js, Vue Router, and Pinia.
* **sdk:** A TypeScript-based SDK for interacting with the Directus API.

## Building and Running

The project uses `pnpm` for package management. The following commands are available in the root `package.json`:

* `pnpm build`: Builds all packages.
* `pnpm format`: Formats the code with Prettier.
* `pnpm lint`: Lints the code with ESLint.
* `pnpm lint:style`: Lints the styles with Stylelint.
* `pnpm test`: Runs tests for all packages.
* `pnpm test:blackbox`: Runs blackbox tests.
* `pnpm test:coverage`: Runs tests with coverage for all packages.

## Development Conventions

* **Commits:** The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.
* **Code Style:** The project uses Prettier for code formatting and ESLint for linting.
* **Contributing:** Contributions are welcome. Please read the `contributing.md` file for more information.
* **Code of Conduct:** The project has a `code_of_conduct.md` file that all contributors are expected to follow.
