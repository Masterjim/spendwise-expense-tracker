"use client";

import DataGuard from "@/components/DataGuard";
import ExportCenter from "@/components/cloud/ExportCenter";

export default function ExportPage() {
  return (
    <DataGuard>
      <ExportCenter />
    </DataGuard>
  );
}
