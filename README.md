# ValidAgent Repository

> **⚠️ Legacy notice:** everything below this line documents the **pre-rebuild (v1)** state of the project. It is being replaced as part of a full rebuild (clean data pipeline with real study data, redesigned frontend). See the [Rebuild Log](#rebuild-log) at the bottom of this file for the current status. The pre-rebuild state remains permanently available via the `v1-legacy` git tag.

A curated collection of AI agents with diverse behavioral traits for research, development, and reproducible experimentation.

**Live Demo:** [https://deqz1080.github.io/agent-repository-v2/](https://deqz1080.github.io/agent-repository-v2/)

## Features

- **60+ Curated Agents** organized into Agent Sets (Examples, The Office, Honesty Pilot Set)
- **Empirically Validated Agents** based on behavioral economics paradigms
- **Agent Set System** to categorize and filter different types of behavioral agents
- **Interactive Visualizations** including Fischbacher Plot, Validation Boxplot, and Decision Scatter
- **Advanced Filtering** by agent set, tags, origin type, and full-text search
- **Export Functionality** to download selected agents as JSON
- **Reproducible Experiments** with prompt templates and reproduction guides
- **TUHH Color Scheme** for consistent branding
- **Fully Static** - deploys to GitHub Pages without a backend

## Agent Sets

Agents are organized into **Agent Sets** to distinguish between different types of behavioral personas:

| Agent Set | Description | Use Case |
|-----------|-------------|----------|
| **Examples** | Placeholder demo agents showcasing research capabilities | General behavioral research examples |
| **TheOffice** | 20 curated fictional personas from "The Office" TV show | Demonstrating personality modeling, character simulation |
| **Honesty Pilot Set** | 26 empirically validated agents from die-roll experiments | Behavioral economics research, honesty validation |

### Honesty Pilot Set (PreStudy2)

The "Honesty Pilot Set" contains **26 empirically validated agents** based on the **Die-Roll Honesty Paradigm** (Fischbacher & Föllmi-Heusi, 2013). This set features:

- **8 Experiment Configurations** with different prompt module combinations
- **Empirical Validation** against theoretical honesty distributions
- **Interactive Visualizations:**
  - **Fischbacher Plot** - Distribution of reported outcomes vs. theoretical uniform distribution
  - **Validation Boxplot** - Cross-experiment comparison of honesty metrics
  - **Decision Scatter** - Reasoning alignment analysis
- **Reasoning Alignment Analysis** - Understanding how agents justify their decisions
- **Configurable Trait Toggles** for detailed behavioral exploration

### The Office Demo Agents

The "TheOffice" agent set includes 20 characters from the TV show, each with:
- Distinct personality traits and behavioral patterns
- Character-specific communication styles
- Ready-to-use prompt templates for simulating their behavior
- Example outputs demonstrating their responses

These are intended as demonstrations of how behavioral agents can model complex personalities with distinct traits, communication patterns, and social dynamics.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS 4 with TUHH Color Scheme
- **Charts:** Recharts for interactive visualizations
- **Deployment:** GitHub Pages (Static Export)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/DeQz1080/agent-repository-v2.git
cd agent-repository-v2

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Create a production build
npm run build
```

The static files will be generated in the `out/` directory.

### Lint

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
validagent-repository/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main repository page
│   ├── sets/              # Agent Sets overview
│   ├── projects/          # Projects page
│   └── resources/         # Resources page
├── components/            # React components
│   ├── AgentCard.tsx              # Agent display card
│   ├── StructuredAgentCard.tsx    # Enhanced agent card with trait toggles
│   ├── SetDetailClient.tsx        # Agent set detail view
│   ├── FilterBar.tsx              # Search and filter controls
│   ├── FeedbackForm.tsx           # User feedback form
│   └── charts/                    # Visualization components
│       ├── FischbacherPlot.tsx    # Honesty distribution chart
│       ├── ValidationBoxplot.tsx  # Cross-experiment comparison
│       └── DecisionScatter.tsx    # Reasoning alignment scatter
├── data/                  # Static data
│   ├── sets/              # Agent set definitions
│   │   ├── examples.json
│   │   ├── theoffice.json
│   │   └── prestudy2.json # Honesty Pilot Set data
│   └── site.ts            # Site configuration
├── types/                 # TypeScript type definitions
│   └── index.ts           # Agent, Tag, Metadata types
├── public/                # Static assets
│   └── avatars/           # Agent avatar images
├── .github/workflows/     # GitHub Actions
│   └── deploy.yml         # Auto-deploy to GitHub Pages
└── next.config.ts         # Next.js configuration
```

## Deployment to GitHub Pages

### Automatic Deployment

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main` or `master`.

### Setup Steps

1. **Create a GitHub Repository**
   ```bash
   git remote add origin https://github.com/DeQz1080/agent-repository-v2.git
   ```

2. **Configure GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Pages**
   - Under "Build and deployment", select **GitHub Actions** as the source

3. **Update Base Path** (if needed)

   In `next.config.ts`, update the `basePath` to match your repository name:
   ```typescript
   basePath: process.env.NODE_ENV === "production" ? "/your-repo-name" : "",
   ```

4. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

5. **Wait for Deployment**
   - Go to **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow
   - Once complete, your site will be live at `https://deqz1080.github.io/agent-repository-v2/`

### Manual Deployment

If you prefer manual deployment:

```bash
# Build the static site
npm run build

# The output is in the 'out' directory
# Upload contents of 'out' to your hosting provider
```

## Agent Data Structure

Each agent follows this structure:

```typescript
type AgentSet = "TheOffice" | "Examples" | "PreStudy2";

interface Agent {
  id: string;              // Unique identifier (e.g., "A-01", "PS2-01")
  agentSet?: AgentSet;     // Agent set category
  name: string;            // Display name
  task: string;            // Task description
  persona: string;         // Persona description
  origin: AgentOrigin;     // "synthetic" | "human" | "curated"
  traits: string[];        // Behavioral traits
  tags: string[];          // Tag IDs for filtering
  promptTemplate: string;  // Ready-to-use prompt
  exampleOutput: string;   // Sample output
  howToReproduce: string;  // Reproduction instructions
  createdAt: string;       // Creation date
  updatedAt: string;       // Last update date

  // PreStudy2 specific fields
  experimentConfig?: string;     // Experiment configuration ID
  honestyMetrics?: HonestyMetrics;
  reasoningAlignment?: number;
}
```

### Agent ID Conventions

- `A-XX` - Example agents (e.g., A-01, A-02)
- `OFF-XX` - The Office agents (e.g., OFF-01, OFF-02)
- `PS2-XX` - Honesty Pilot Set agents (e.g., PS2-01, PS2-02)

## Avatar Images

Agent cards display a circular avatar. The system supports custom avatar images:

1. **Location:** Place images in `/public/avatars/`
2. **Naming:** Use the agent ID as filename (e.g., `OFF-01.png` for Michael Scott)
3. **Format:** PNG recommended, 40x40px minimum
4. **Fallback:** If no image exists, colored initials are displayed

Example:
```
/public/avatars/
  OFF-01.png  # Michael Scott
  OFF-02.png  # Dwight Schrute
  PS2-01.png  # Honesty Pilot Agent
```

## Contributing

Contributions are welcome! To add a new agent:

1. Fork the repository
2. Add your agent to the appropriate set in `data/sets/`
3. Ensure all required fields are filled
4. Submit a pull request

## Trait Categories

| Category | Description |
|----------|-------------|
| **Honesty** | Agents focused on truthfulness and transparency |
| **Climate** | Environmental awareness and sustainability |
| **Social Norms** | Cultural sensitivity and social dynamics |
| **Teaching** | Educational and instructional capabilities |

## References

- Fischbacher, U., & Föllmi-Heusi, F. (2013). Lies in disguise - An experimental study on cheating. *Journal of the European Economic Association*, 11(3), 525-547.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- TUHH (Technische Universität Hamburg)
- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Visualizations with [Recharts](https://recharts.org/)

## Rebuild Log

Everything above this section describes the legacy (pre-rebuild) project. The permanent snapshot of that state is tagged [`v1-legacy`](../../tree/v1-legacy). New entries here document the rebuild as it happens; this section (and the rest of the README) will be rewritten once the rebuild lands on `main`.

### 2026-07-01 — Rebuild started

- Tagged the pre-rebuild state as `v1-legacy` (permanent reference, checkoutable, no longer live once the rebuild ships).
- Started work on the `rebuild` branch; `main` and the live site stay untouched until the rebuild is merged.
- Goals: rebuild the data pipeline from real study data (raw data kept locally, not committed) into a clean `agents.csv` + derived stats, and redesign the frontend.
