import { AppShell } from "@/components/bi/app-shell";
import { Skel, SkelCard } from "@/components/bi/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <Skel w={160} h={11} />
        <Skel w={320} h={32} style={{ marginTop: 12 }} />
        <div className="bi-grid-split" style={{ marginTop: 24 }}>
          <SkelCard h={260} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SkelCard h={120} />
            <SkelCard h={120} />
          </div>
        </div>
        <SkelCard h={240} style={{ marginTop: 14 }} />
      </div>
    </AppShell>
  );
}
