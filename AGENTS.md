# AI Assistant Guide

This file provides guidance to AI coding assistants when working with code in this repository. The comic-ai project is a **pure frontend React + Vite application** that converts novel text into comic panels using AI. Adherence to these guidelines is crucial for maintaining code quality and consistency.

## Guiding Principles (MUST FOLLOW)

- **Keep it clear**: Write code that is easy to read, maintain, and explain.
- **Match the house style**: Reuse existing patterns, naming, and conventions.
- **Search smart**: Prefer `ast-grep` for semantic queries; fall back to `rg`/`grep` when needed.
- **Build with ShadcnUI**: Use ShadcnUI for every new UI component; never add `antd` or `styled-components`.
- **Research via subagent**: Lean on `subagent` for external docs, APIs, news, and references.
- **Seek review**: Ask a human developer to review substantial changes before merging.
- **Commit in rhythm**: Keep commits small, conventional, and emoji-tagged.
- **Pure Frontend Only**: All AI logic runs in the browser; never add backend API routes.
- **Client-Side AI**: Use `ai-services.ts` for all AI operations; store API keys in localStorage.

## Development Commands

- **Install**: `pnpm install` - Install all project dependencies
- **Development**: `pnpm dev` - Runs Vite dev server with hot module replacement
- **Build**: `pnpm build` - Creates a production build of the application
- **Preview**: `pnpm preview` - Preview the production build locally
- **Lint**: `pnpm lint` - Lints the codebase using ESLint

## Project Architecture

### Pure Frontend Architecture 🎯

**NO BACKEND API ROUTES** - All AI processing happens in the browser using Vercel AI SDK.

### Directory Structure
- **Main Entry** (`index.html`): HTML entry point
- **App Entry** (`src/main.tsx`): React app entry with providers
- **App Component** (`src/App.tsx`): Main application component
- **Components** (`src/components/`): Reusable UI components built with ShadcnUI
  - `api-key-settings.tsx` - Dialog for configuring DashScope API Key
  - `character-create-dialog.tsx` - Character creation with AI-generated visuals
  - `missing-characters-dialog.tsx` - Handle missing characters from novel analysis
  - `comic-generation-options.tsx` - Comic generation settings
  - `comic-panel-grid.tsx` - Display generated comic panels
  - Other UI components for settings and display
- **Lib** (`src/lib/`): Core business logic
  - `ai-services.ts` **[MAIN FILE]** - Frontend AI service layer (analyzeNovel, generateComic, generateCharacter)
  - `db.ts` - IndexedDB operations for character storage
  - `queue.ts` - Task queue for concurrent generation
  - `utils.ts` - Utility functions
- **Types** (`src/types/`): TypeScript type definitions
- **Public** (`public/`): Static assets

### Key Components Architecture

1. **AI Services** (`src/lib/ai-services.ts`)
   - `analyzeNovel()` - Converts novel text to comic scenes
   - `generateComic()` - Generates comic panels from scene descriptions
   - `generateCharacter()` - Generates character design sheets (three-view)
   - API Key management (localStorage operations)
   - Direct calls to DashScope REST API from browser

2. **API Key Management**
   - Stored in browser `localStorage` under key `comic-ai-dashscope-key`
   - User configures via `ApiKeySettings` dialog component
   - Never exposed to any server

3. **State Management**: React hooks (`useState`, `useRef`, `useEffect`)

4. **UI Components**: ShadcnUI components with Tailwind CSS styling

5. **Type Safety**: Zod schemas for input validation

### Data Flow

```
User Input (Novel Text)
    ↓
page.tsx (collect settings & API key from localStorage)
    ↓
ai-services.ts (analyzeNovel with API key)
    ↓
DashScope API (Qwen-Plus for analysis)
    ↓
Scene data returned to browser
    ↓
Display scenes in comic-panel-grid
    ↓
User triggers generation
    ↓
ai-services.ts (generateComic with API key)
    ↓
DashScope API (Qwen-Image-Plus/Edit for generation)
    ↓
Image URL returned to browser
    ↓
Display in UI
```

## Technologies and AI Services

### Core Technologies
- **Framework**: React 19 + Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ShadcnUI components
- **Validation**: Zod for schema validation
- **AI SDK**: Vercel AI SDK (`ai` package) for structured outputs and text generation
- **Storage**: 
  - IndexedDB for character library persistence
  - localStorage for API Key storage

### AI Provider: DashScope (Alibaba Cloud)

**All AI services use DashScope exclusively - pure browser-based calls**

- **Text Analysis**: 
  - Model: `qwen-plus`
  - Use: Novel analysis, prompt optimization
  - Method: `generateObject` from Vercel AI SDK for structured output
  
- **Image Generation**:
  - `qwen-image-plus` - Basic image generation (sync)
  - `qwen-image-edit` - Image editing with reference images (sync)
  - Direct REST API calls from browser
  - Endpoint: `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

## Key Files and Their Purpose

### Frontend Services
- `src/lib/ai-services.ts`: **[CORE FILE]** All AI operations
  - Exports: `analyzeNovel()`, `generateComic()`, `generateCharacter()`
  - Exports: `getStoredApiKey()`, `setStoredApiKey()`, `clearStoredApiKey()`
  - Handles all DashScope API calls

### UI & Components
- `src/App.tsx`: Main application page
  - Imports from `ai-services.ts` for all AI operations
  - Manages state with React hooks
  - Coordinates user interactions
  
- `src/components/api-key-settings.tsx`: API Key configuration dialog
  - Allows users to input and save their DashScope API Key
  - Shows setup instructions
  
- `src/components/character-create-dialog.tsx`: Character creation
  - Uses `generateCharacter()` from `ai-services.ts`
  - Saves to IndexedDB via `db.ts`
  
- `src/components/missing-characters-dialog.tsx`: Auto-create missing characters
  - Batch processing with task queue
  - Uses `generateCharacter()` from `ai-services.ts`

### Data Management
- `src/lib/db.ts`: IndexedDB operations for character storage
- `src/lib/queue.ts`: Task queue for concurrent batch operations
- `src/types/index.ts`: Type definitions

## Common Tasks

### Adding a New AI Feature
1. Add the function to `src/lib/ai-services.ts`
2. Accept `apiKey?: string` parameter
3. Use `getStoredApiKey()` if no key provided
4. Make direct browser fetch call to DashScope API
5. Return typed result
6. Import and use in component

### Handling API Key
```typescript
// In components
import { getStoredApiKey } from '@/lib/ai-services';

const apiKey = getStoredApiKey();
if (!apiKey) {
  setError('请先在设置中配置 DashScope API Key');
  return;
}

// Call AI service with key
const result = await generateComic({ ..., apiKey });
```

### Creating New UI Component
1. Use ShadcnUI components from `src/components/ui/`
2. Import types from `src/types/`
3. Use Zod for input validation
4. Import AI services from `src/lib/ai-services.ts`
5. Handle API Key requirement gracefully

## Important Constraints

❌ **DO NOT**
- Add any backend server code
- Use `process.env.DASHSCOPE_API_KEY` in client code
- Store sensitive data anywhere except localStorage
- Add new backend dependencies
- Create server-side rendering of AI operations

✅ **DO**
- Use `src/lib/ai-services.ts` for all AI operations
- Get API key from `getStoredApiKey()` 
- Make fetch calls directly from browser
- Handle errors gracefully with user-friendly messages
- Keep AI logic modular and testable

## Deployment

Since this is pure frontend, it can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

No special backend setup required!

## Related Files
- `README.md` - User-facing documentation
- `ARCHITECTURE.md` - Detailed architecture explanation
- `PANEL_EDIT_FEATURE.md` - Feature-specific documentation
