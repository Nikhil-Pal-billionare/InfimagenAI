import Script from "next/script";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InfiMagen — AI Content Platform",
  description: "Generate images, videos, thumbnails, scripts and more with AI",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#080808] text-white">{children}
       <Script id="clarity" strategy="afterInteractive">
  {`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "wuljhk1k5o");
  `}
       </Script>
      </body>
    </html>
  );
}
