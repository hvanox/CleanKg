import { ReportCard } from "@/components/ReportCard";

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <ReportCard id={id} />;
}
