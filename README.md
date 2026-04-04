# ANBI Donation Tracker

A specialized web application to help users calculate their total donations to ANBI (Public Benefit Organizations) in the Netherlands for tax deduction purposes.

## Features

<!---
AI is Disabled: only client-side analysis
**AI-Powered Analysis**: Uses Gemini 3 Flash to identify ANBI organizations from bank transaction descriptions.
-->
- **Manual Grouping**: Client-side algorithm to group transactions by counterparty and sum amounts without AI.
- **Multi-Language Support**: Full support for English and Dutch (i18next).
- **CSV Import**: Supports bank statement exports from major Dutch banks (ING, ABN AMRO, Rabo, etc.).
- **Fiscal Year Filtering**: Easily calculate totals for specific tax years.
- **Responsive Design**: Polished UI built with Tailwind CSS and Motion.
- **Unit Tested**: Core analysis logic is verified with Vitest.

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI**: Google Gemini API (@google/genai)
- **Styling**: Tailwind CSS 4, Lucide React (icons)
- **Animation**: Motion (formerly Framer Motion)
- **Parsing**: PapaParse (CSV)
- **Internationalization**: react-i18next
- **Testing**: Vitest

## Getting Started

1. Export your bank statement as a CSV file from your banking portal.
2. Upload the CSV to the app.
3. Select the fiscal year you want to analyze.
<!--
AI is Disabled: only client-side analysis
4. Choose between **AI Analysis** (to find charities) or **Manual Grouping** (to see all recurring payments).
-->
5. Review your results and export them for your tax return.

## Development

### Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the production application.
- `npm run lint`: Run TypeScript type checking.
- `npm run format`: Run prettier formatter.
- `npm run test`: Run unit tests using Vitest.

## Security

- **Privacy First**: Bank statements are processed in the browser.
<!--
AI is Disabled: only client-side analysis
AI analysis only sends transaction descriptions and amounts to the Gemini API; no account numbers or sensitive PII are shared.
-->
- **Verification**: Always verify AI-identified donations with official ANBI records before submitting tax returns.
