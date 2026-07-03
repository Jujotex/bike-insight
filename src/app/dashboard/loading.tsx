import { AppShell } from "@/components/bi/app-shell";
import { Skel, SkelCard } from "@/components/bi/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="bi-page" style={{ maxWidth: 1200 }}>
        <Skel w={220} h={11} />
        <Skel w={300} h={32} style={{ marginTop: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
          <SkelCard h={84} />
          <SkelCard h={84} />
          <SkelCard h={84} />
        </div>
        <SkelCard h={76} style={{ marginTop: 14 }} />
        <div className="bi-grid-split" style={{ marginTop: 14 }}>
          <SkelCard h={280} />
          <SkelCard h={280} />
        </div>
      </div>
    </AppShell>
  );
}
