import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Classroom Notes', description: 'A space for individual responses and shared discussion.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
