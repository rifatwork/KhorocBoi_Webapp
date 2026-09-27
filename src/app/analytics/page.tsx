import type { Metadata } from "next";
import { AnalyticsView } from "@/features/analytics/components/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

function toInt(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) ? n : undefined;
}

export default async function AnalyticsPage(props: PageProps<"/analytics">) {
  const searchParams = await props.searchParams;
  const year = toInt(searchParams.year);
  const month = toInt(searchParams.month);
  const validYear = year !== undefined && year >= 2000 && year <= 9999 ? year : undefined;
  const validMonth = validYear && month !== undefined && month >= 1 && month <= 12 ? month : undefined;

  return <AnalyticsView year={validYear} month={validMonth} />;
}
