import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonthArchiveView } from "@/features/tabs/components/ArchiveViews";

export const metadata: Metadata = { title: "Archive" };

export default async function MonthArchivePage(props: PageProps<"/archive/[year]/[month]">) {
  const params = await props.params;
  const year = Number(params.year);
  const month = Number(params.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) notFound();
  return <MonthArchiveView year={year} month={month} />;
}
