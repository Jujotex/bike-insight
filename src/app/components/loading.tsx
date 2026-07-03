import { AppShell } from "@/components/bi/app-shell";
import { Skel, SkelCard } from "@/components/bi/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <Skel w={140} h={32} />
        <Skel w={320} h={12} style={{ marginTop: 10 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <Skel w={90} h={32} r={999} />
          <Skel w={120} h={32} r={999} />
          <Skel w={70} h={32} r={999} />
        </div>
        <SkelCard h={340} style={{ marginTop: 16 }} />
      </div>
    </AppShell>
  );
}
