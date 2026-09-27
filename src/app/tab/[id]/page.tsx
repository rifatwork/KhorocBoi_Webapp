import type { Metadata } from "next";
import { TabEditor } from "@/features/tabs/components/TabEditor";

export const metadata: Metadata = { title: "Tab" };

export default async function TabPage(props: PageProps<"/tab/[id]">) {
  const { id } = await props.params;
  return <TabEditor key={id} tabId={id} />;
}
