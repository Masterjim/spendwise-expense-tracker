import type { Metadata } from "next";
import SharedSnapshotView from "@/components/cloud/SharedSnapshotView";

export const metadata: Metadata = {
  title: "Shared snapshot",
  // Shared snapshots are private-by-link; keep them out of search engines.
  robots: { index: false, follow: false },
};

export default function SharePage() {
  return <SharedSnapshotView />;
}
