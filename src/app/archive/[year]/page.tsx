import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YearArchiveView } from "@/features/tabs/components/ArchiveViews";

export const metadata: Metadata = { title: "Archive" };

export default async function YearArchivePage(props: PageProps<"/archive/[year]">) {
  const year = Number((await props.params).year);
  if (!Number.isInteger(year) || year < 2000 || year > 9999) notFound();
  return <YearArchiveView year={year} />;
}
