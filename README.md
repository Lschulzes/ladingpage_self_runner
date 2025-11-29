# Frontend - Vite + React + TypeScript

A modern frontend setup with the latest technologies:

- ⚡ **Vite** - Next generation frontend tooling
- ⚛️ **React 19** - UI library
- 📘 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **shadcn/ui** - Beautiful component library built on Radix UI
- 🐻 **Zustand** - Lightweight state management
- 📝 **react-markdown** - Markdown rendering

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui components (Button, Card, etc.)
│   └── ...          # Your custom components
├── lib/
│   └── utils.ts     # Utility functions (cn helper)
├── store/
│   └── example-store.ts  # Zustand store example
└── App.tsx          # Main app component
```

## Features

### shadcn/ui Components

The project includes example components from shadcn/ui:

- `Button` - Versatile button component with multiple variants
- `Card` - Card container with header, content, and footer

To add more components, you can use the shadcn/ui CLI or manually add them following the same pattern.

### Zustand Store

Example store located at `src/store/example-store.ts` demonstrates:

- State management
- Actions
- TypeScript types

### react-markdown

The `MarkdownExample` component shows how to render markdown content with GitHub Flavored Markdown support.

## Path Aliases

The project uses path aliases for cleaner imports:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/store` → `src/store`

## Styling

- Tailwind CSS is configured with shadcn/ui's design system
- CSS variables are used for theming (light/dark mode support)
- Typography plugin is included for better markdown rendering

## Next Steps

1. Add more shadcn/ui components as needed
2. Expand the Zustand store with your app's state
3. Create your custom components
4. Set up routing (consider React Router)
5. Add form handling (consider React Hook Form + Zod)

Enjoy building! 🚀
