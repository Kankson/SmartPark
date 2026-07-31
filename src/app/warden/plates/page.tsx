import { PlateSearchPanel } from "@/app/warden/plates/plate-search-panel";

export default async function PlatesPage({
  searchParams
}: {
  searchParams: Promise<{ plate?: string }>;
}) {
  const { plate } = await searchParams;
  return <PlateSearchPanel initialPlateNumber={plate?.slice(0, 20)} />;
}
