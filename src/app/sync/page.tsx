import type { Metadata } from "next";
import { SyncView } from "@/features/cloud-sync/components/SyncView";

export const metadata: Metadata = { title: "Cloud Sync" };

export default function SyncPage() {
  return <SyncView />;
}
