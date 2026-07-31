import { Suspense } from "react";
import { StudyHome } from "@/components/study-home";

export default function Home() {
  return <Suspense fallback={null}><StudyHome /></Suspense>;
}
