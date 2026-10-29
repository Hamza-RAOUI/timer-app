import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA / installability — manifest declares the Windows 11 widget. */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Pick light/dark before first paint (saved choice, else the OS setting). */}
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const themeBoot = `(function(){try{var m='system';var raw=localStorage.getItem('@flowglass/settings/v4');if(raw){var s=JSON.parse(raw);if(s&&s.themeMode)m=s.themeMode;}var d=m==='dark'||(m==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.setAttribute('data-theme',d?'dark':'light');e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

const globalCss = `
html, body { background-color: #F4F6FB; }
html[data-theme="dark"], html[data-theme="dark"] body { background-color: #070A18; }

/* The static HTML is rendered light. Dark visitors see the page once the app has
   applied the dark theme (or after 1.2s as a fallback) — no white flash. */
html[data-theme="dark"]:not([data-ready]) #root { opacity: 0; animation: fg-reveal 0s 1.2s forwards; }
@keyframes fg-reveal { to { opacity: 1; } }

/* Visible keyboard focus everywhere. */
:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; border-radius: 6px; }
html[data-theme="dark"] :focus-visible { outline-color: #A5B4FC; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}`;
