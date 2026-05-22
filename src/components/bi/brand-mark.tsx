import Link from "next/link";

interface BrandMarkProps {
  large?: boolean;
  href?: string;
}

export function BrandMark({ large = false, href = "/" }: BrandMarkProps) {
  const s = large ? 44 : 28;
  const fontSize = large ? 22 : 15;

  const inner = (
    <div className="flex items-center" style={{ gap: large ? 12 : 8 }}>
      <div
        style={{
          width: s,
          height: s,
          borderRadius: large ? 12 : 8,
          background: "var(--bi-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={s * 0.5}
          height={s * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--bi-accent-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18l4-8 4 6 4-10 4 8" />
        </svg>
      </div>
      <span
        style={{
          fontSize,
          fontWeight: 600,
          letterSpacing: -0.3,
          color: "var(--bi-ink)",
        }}
      >
        Bike Insight
      </span>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
