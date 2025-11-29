import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const markdownContent = `# Welcome to the Example

This is a **markdown** example using \`react-markdown\` with GitHub Flavored Markdown support.

## Features

- ✅ React + TypeScript
- ✅ Vite for fast builds
- ✅ Tailwind CSS for styling
- ✅ shadcn/ui components
- ✅ Zustand for state management
- ✅ react-markdown for content

### Code Example

\`\`\`typescript
const greeting = "Hello, World!"
console.log(greeting)
\`\`\`

> This is a blockquote example

[Learn more](https://react.dev) about React!
`;

export function MarkdownExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Markdown Example</CardTitle>
        <CardDescription>
          Rendered with react-markdown and remark-gfm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='prose prose-sm max-w-none dark:prose-invert'>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
