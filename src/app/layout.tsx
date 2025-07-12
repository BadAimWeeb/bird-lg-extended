import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_TITLE || "Bird LG Extended",
  description: process.env.NEXT_PUBLIC_DESCRIPTION || "looking glass & network tools using bird-lg",
};

import RootLayout from "./layout.client";
export default RootLayout;
