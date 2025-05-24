# Stock Price Aggregation Frontend

A React-based web application for real-time stock price analysis and correlation visualization.

## Features

- **Stock Price Analysis**: Interactive charts with real-time data
- **Correlation Heatmap**: Visual correlation matrix between stocks
- **Material UI Design**: Professional and responsive interface
- **Real-time Updates**: Automatic data refresh
- **Interactive Tooltips**: Detailed information on hover

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Stock Analysis page
│   ├── correlation/
│   │   └── page.tsx          # Correlation Heatmap page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── navigation.tsx        # Navigation component
├── lib/
│   └── theme.ts             # Material UI theme
├── package.json
├── tsconfig.json
└── next.config.mjs
\`\`\`

## API Integration

The application consumes the stock exchange API:
- `GET /stocks` - Fetch available stocks
- `GET /stocks/:ticker?minutes=m` - Fetch stock price history

## Technologies Used

- Next.js 14
- React 18
- Material UI
- Chart.js
- TypeScript
