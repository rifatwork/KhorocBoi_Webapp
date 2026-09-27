import type { Metadata } from "next";
import { RecycleBinView } from "@/features/recycle-bin/components/RecycleBinView";

export const metadata: Metadata = { title: "Recycle Bin" };

export default function RecycleBinPage() {
  return <RecycleBinView />;
}
