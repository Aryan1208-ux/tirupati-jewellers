import { redirect } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { handle } = await params;
  redirect(`/shop?category=${encodeURIComponent(handle)}`);
}
