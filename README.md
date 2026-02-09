# Kaboo - Card Game

Kaboo is a modern, interactive web-based card game built with Next.js, React, and TypeScript. It features a polished UI, smooth animations, and a robust state management system to handle game logic.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Form Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

## 🛠️ Features

- **Interactive Gameplay:** Play Kaboo against AI or local players (implementation dependent).
- **Smooth Animations:** Card movements and interactions are animated for a better user experience.
- **Responsive Design:** Optimized for both desktop and mobile devices.
- **Game Logic:** Complex game rules handled via a dedicated state store.
- **Sound Effects:** Immersive audio feedback for game actions.

## 📦 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed. This project uses [pnpm](https://pnpm.io/).

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd kaboo-fe
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `pnpm dev` - Start the development server.
- `pnpm build` - Build the application for production.
- `pnpm start` - Start the production server.
- `pnpm lint` - Run ESLint to check for code quality issues.
- `pnpm test` - Run unit tests with Vitest.
- `pnpm test:watch` - Run tests in watch mode.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components and game-specific components.
  - `game`: Core game components (Board, Cards, PlayerHand, etc.).
  - `scoring`: Components related to scoring and game end.
  - `ui`: Generic UI components (Buttons, Dialogs, etc.).
- `src/store`: Zustand stores for game state management.
- `src/lib`: Utility functions and helper logic.
- `src/hooks`: Custom React hooks.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
