import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Container } from "@mui/material";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excel to Gantt Chart Converter | XLS to Gantt",
  description:
    "Transform your Excel files into beautiful Gantt charts with our easy-to-use conversion tool. Plan projects efficiently with our interactive Gantt chart visualization.",
  keywords: [
    "excel to gantt",
    "xls to gantt",
    "gantt chart creator",
    "project planning tool",
    "excel converter",
    "gantt visualization",
  ],
  authors: [{ name: "XLS to Gantt Team" }],
  creator: "XLS to Gantt",
  publisher: "XLS to Gantt",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xls-to-gantt.vercel.app/",
    title: "Excel to Gantt Chart Converter | XLS to Gantt",
    description:
      "Transform your Excel files into beautiful Gantt charts with our easy-to-use conversion tool.",
    siteName: "XLS to Gantt",
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to Gantt Chart Converter | XLS to Gantt",
    description:
      "Transform your Excel files into beautiful Gantt charts with our easy-to-use conversion tool.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Container
          component={"main"}
          sx={{
            width: "100vw",
            height: "100vh",
          }}
        >
          {children}
        </Container>
      </body>
    </html>
  );
}
