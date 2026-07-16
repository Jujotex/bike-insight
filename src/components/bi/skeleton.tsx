// Blocs de chargement (skeletons) — utilisés par les loading.tsx des routes.
// Pas de "use client" nécessaire : purement présentationnel.

export function Skel({
  w = "100%",
  h = 14,
  r = 8,
  style,
}: {
  w?: number | string;
  h?: number;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "var(--bi-line)",
        animation: "bi-pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkelCard({ h, style }: { h: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: h,
        borderRadius: 18,
        background: "var(--bi-card)",
        border: "1px solid var(--bi-line)",
        padding: 20,
        ...style,
      }}
    >
      <Skel w={120} h={11} />
      <Skel w="60%" h={20} style={{ marginTop: 14 }} />
      <Skel w="80%" h={11} style={{ marginTop: 10 }} />
    </div>
  );
}
