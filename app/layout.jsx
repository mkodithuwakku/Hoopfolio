import "./globals.css";

export const metadata = {
  title: "Hoopfolio",
  description: "Free-to-play NBA player stock market game."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
