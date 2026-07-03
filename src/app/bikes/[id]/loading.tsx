import { AppShell } from "@/components/bi/app-shell";
import { Skel, SkelCard } from "@/components/bi/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <Skel w={140} h={11} />
        <Skel w={280} h={32} style={{ marginTop: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 26 }}>
          <SkelCard h={92} />
          <SkelCard h={92} />
          <SkelCard h={92} />
          <SkelCard h={92} />
        </div>
        <div className="bi-grid-split-lg" style={{ marginTop: 14, gap: 14 }}>
          <SkelCard h={320} />
          <SkelCard h={320} />
        </div>
      </div>
    </AppShell>
  );
}
