# @niobi/shared-components

Shared UI components for Niobi Customer Success Dashboard with consistent Niobi branding and styling.

## Components

### Button
A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@niobi/shared-components';

<Button variant="primary" size="md">
  Click me
</Button>
```

### Input
A form input component with label, error states, and icon support.

```tsx
import { Input } from '@niobi/shared-components';

<Input
  label="Email"
  placeholder="Enter your email"
  error="Invalid email format"
/>
```

### Card
A flexible card container with header, footer, and hover effects.

```tsx
import { Card } from '@niobi/shared-components';

<Card variant="elevated" hoverable>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

## Theme

The package includes the Niobi theme system with brand colors, typography, and spacing.

```tsx
import { niobiTheme, generateCSSVariables } from '@niobi/shared-components';

// Use theme values directly
const primaryColor = niobiTheme.colors.primary[500];

// Generate CSS variables
const cssVars = generateCSSVariables(niobiTheme);
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes
npm run dev
```