# Local Chat

This project is a user interface for a local AI Large Language Model (LLM) running with Ollama. The end goal is to explore the possibility of connecting this interface with a command-line interface (CLI) that can interact with the user's terminal.

## Features

*   **Chat Interface:** A simple and intuitive chat interface to interact with the local LLM.
*   **File Upload:** Upload files to provide context to the LLM.
*   **Web Search:** Perform web searches to gather information.
*   **Dark Mode:** A dark mode theme for a better user experience.
*   **Responsive Design:** The application is responsive and works on different screen sizes.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **LLM:** [Ollama](https://ollama.ai/)

## Project Structure

The project is structured as follows:

```
/
├── app/              # Main application files
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # API routes
├── public/           # Static assets
├── services/         # Services for interacting with external APIs
├── styles/           # Global styles
└── types/            # TypeScript types
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v22 or later)
*   [pnpm](https://pnpm.io/)
*   [Ollama](https://ollama.ai/)

### Installing

1.  Clone the repository
2.  Install the dependencies:
    ```bash
    pnpm install
    ```
3.  Run the development server:
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details.

## Code of Conduct

Please see the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file for more details.
