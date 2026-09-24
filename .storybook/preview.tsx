import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import { Plus_Jakarta_Sans, Space_Grotesk, Source_Sans_3 } from 'next/font/google'
import '../src/app/globals.css'

// Mirrors the font setup in src/app/layout.tsx: the CSS variables these
// generate (--font-jakarta, --font-grotesk, --font-inter) are what
// globals.css's @theme block aliases the font-jakarta/font-grotesk/font-inter
// utility classes to. Without this, those classes fall back to the browser's
// default sans-serif inside Storybook.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
})

const sourceSansPro = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  decorators: [
    (Story) => (
      <div className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${sourceSansPro.variable} ${sourceSansPro.className}`}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
