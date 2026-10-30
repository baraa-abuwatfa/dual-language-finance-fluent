# Remix of Remix of AI CFO

AI CFO — Phase 1: Visual Foundation and Landing Page



Build the first frontend version of a professional AI CFO web application for small businesses.



IMPORTANT: This is Phase 1 only. Focus on the visual foundation, public landing page, internationalization, and responsive layout. Do not implement the database or backend yet.



1. Brand Identity



Create a premium, trustworthy financial SaaS design inspired by elegant navy-blue and warm-beige color palettes.



Use these exact design tokens:



- Midnight Navy: #071739

- Steel Blue: #4B6382

- Mist Blue: #A4B5C4

- Cloud Gray: #CDD5DB

- Warm Taupe: #A68868

- Champagne Beige: #E3C39D

- Main Background: #F7F8FA

- Warm Background: #F7F5F1

- Card Background: #FFFFFF

- Primary Text: #071739

- Secondary Text: #64748B

- Positive Status: #16865C

- Negative Status: #D9485F



Use light backgrounds throughout the application. Do not use a dark full-page background.



Use navy for primary buttons, headings, and important navigation. Use blue and beige for charts, highlights, and decorative elements.



Create reusable CSS variables or design tokens so the palette can be maintained consistently.



2. Landing Page



Create a polished public landing page with:



- A responsive navigation bar.

- AI CFO branding and a simple professional logo mark.

- Language switcher for Arabic and English.

- Navigation links: Features, How It Works, About.

- Login and Get Started buttons.

- Hero section explaining how AI CFO helps small businesses understand their finances.

- A beautiful dashboard preview with sample data clearly identified as illustrative.

- Feature cards for invoice processing, expense tracking, financial insights, and automated reports.

- A How It Works section with three clear steps.

- An AI financial insights preview.

- A final call-to-action section.

- A professional footer.



Do not create pricing plans, subscription pages, or payment features.



3. Arabic and English Support



Implement a proper frontend internationalization structure from the beginning.



English:



- Left-to-right layout.

- English navigation, headings, buttons, labels, and sample content.



Arabic:



- Right-to-left layout using dir="rtl".

- Natural, clear Arabic wording.

- Correct alignment and layout direction.

- Arabic navigation, headings, buttons, labels, and sample content.



The language switcher must work and update the visible page content and document direction.



Avoid mixing Arabic and English randomly within the same interface. Keep financial numbers, currencies, and dates readable.



Do not implement the language switcher as a decorative button. It must actually change the displayed language.



4. Responsive Design



Make the landing page work on:



- Mobile phones starting at 320px wide.

- Tablets.

- Laptops.

- Large desktop screens.



Use responsive layouts, flexible widths, and appropriate breakpoints.



On mobile:



- Collapse navigation into a mobile menu.

- Stack feature cards vertically when needed.

- Prevent horizontal overflow.

- Keep buttons touch-friendly.

- Ensure text is readable.

- Make the dashboard preview fit the screen without cutting off essential content.



5. Animation



Add subtle, professional animations:



- Smooth hero text entrance.

- Gentle dashboard-preview entrance.

- Soft reveal animations for feature cards.

- Subtle hover transitions for buttons and cards.

- Smooth scrolling between landing-page sections.



Respect prefers-reduced-motion and avoid distracting or excessive animation.



6. Dashboard Preview



Create a visual preview of a future AI CFO dashboard within the landing page.



Include sample KPI cards for:



- Revenue.

- Expenses.

- Net Profit.

- Cash Flow.



Include an attractive chart preview using the brand colors.



This is only a visual mockup in Phase 1. Do not create the actual financial dashboard routes or database logic yet.



7. Technical Quality



- Use reusable components.

- Keep the code organized and easy to extend.

- Ensure buttons, language switching, and mobile navigation work.

- Do not add fake backend functionality.

- Do not connect Supabase yet.

- Do not expose API keys or secrets.

- Do not claim that sample financial figures are real.

- Do not install unnecessary libraries.



After implementation, test the language switcher, RTL/LTR layout, mobile navigation, and responsive behavior.



At the end, summarize the pages and components created, the files changed, and any remaining issues. Stop after Phase 1; do not begin the database or backend work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c361b7e4-5fdd-4264-8acb-4422e7f87854).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
