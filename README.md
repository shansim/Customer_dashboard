# Customer Success Dashboard

This repository contains the source code for the Niobi Customer Success Dashboard, a web application designed to provide Niobi employees with a centralized platform for customer success operations.

## About the Dashboard

The Customer Success Dashboard is a secure, single-entry point for various customer success tools. The initial phase of the project focuses on integrating an existing reconciliation tool into a new dashboard shell with enterprise-grade, domain-restricted authentication.

The key features of the dashboard include:

- **Secure Authentication:** Access is restricted to Niobi employees with a `@niobi.co` email address.
- **Reconciliation Tool:** The core functionality of the existing reconciliation tool is embedded within the dashboard, allowing users to upload, process, and analyze reconciliation data.
- **Centralized Platform:** The dashboard is designed to be extensible, with plans to incorporate additional customer success features in the future.

## Project Structure

The project is organized as a monorepo using npm workspaces. This structure allows for better code sharing and modularity. The main packages are:

- `packages/dashboard-shell`: The main application shell that provides the dashboard layout, navigation, and authentication. It is the entry point of the application.
- `packages/reconciliation-tool`: The core reconciliation functionality, which is embedded as a feature within the dashboard. It is a self-contained package that can be used independently.
- `packages/shared-components`: A library of shared React components used across the different packages.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Development Workflow

### Building Individual Packages

To speed up the development server, it is recommended to build the individual packages first. You can build each package separately using the following commands:

- **Build the shared-components package:**

  ```bash
  npm run build --workspace=@niobi/shared-components
  ```

- **Build the reconciliation-tool package:**

  ```bash
  npm run build --workspace=reconciliation-tool
  ```

- **Build all packages:**

  ```bash
  npm run build --workspaces
  ```

### Running the Development Server

Once the packages are built, you can run the development server for the `dashboard-shell`:

```bash
npm run dev:dashboard
```

This will start the development server for the `dashboard-shell` package, and you can access the application at `http://localhost:3000`.

Alternatively, you can run the development server for all packages simultaneously:

```bash
npm run dev
```

This will start the development servers for all the packages in the monorepo.

## Test Credentials

The dashboard is configured with mock authentication for development testing. Here are a couple of credentials you can use to log in:

- **Email:** `user@niobi.co`
- **Password:** `password`

- **Email:** `admin@niobi.co`
- **Password:** `admin123`

For a more comprehensive list of test users and additional details on the mock authentication, please refer to the [TEST_CREDENTIALS.md](packages/dashboard-shell/TEST_CREDENTIALS.md) file.

### Other useful commands

- `npm run build`: Builds all the packages in the monorepo.
- `npm run test`: Runs the tests for all the packages.
- `npm run lint`: Lints the code in all the packages.
