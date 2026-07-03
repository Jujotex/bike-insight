import { AppShell } from "@/components/bi/app-shell";
import { Skel, SkelCard } from "@/components/bi/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <Skel w={180} h={32} />
        <Skel w={260} h={12} style={{ marginTop: 10 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
          <SkelCard h={140} />
          <SkelCard h={140} />
        </div>
      </div>
    </AppShell>
  );
}
