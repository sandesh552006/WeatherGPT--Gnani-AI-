import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

export const metadata: Metadata = {
  title: 'WeatherGPT – Conversational Weather Assistant',
  description: 'AI weather companion powered by Gemini & Open-Meteo with Gnani AI Multilingual Voice.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('weathergpt_theme_mode');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.remove('dark');
              }
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#f4f7fb] dark:bg-[#070b19] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
