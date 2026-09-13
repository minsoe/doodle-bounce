import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Jumping Game',
  description: 'An arcade jumping game featuring the hand-drawn Doodle Bounce start screen, authentic sketchpad graph paper theme, 9 playable doodle characters, and dynamic vertical jumping.',
  openGraph: {
    title: 'Jumping Game',
    description: 'An arcade jumping game featuring the hand-drawn Doodle Bounce start screen, authentic sketchpad graph paper theme, 9 playable doodle characters, and dynamic vertical jumping.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jumping Game',
    description: 'An arcade jumping game featuring the hand-drawn Doodle Bounce start screen, authentic sketchpad graph paper theme, 9 playable doodle characters, and dynamic vertical jumping.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
