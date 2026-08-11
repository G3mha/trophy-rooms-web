import styles from "./TrophyShelf.module.css";

// Trophy cabinet silhouette band (see .claude/skills/trophy-cabinet-design).
// These are brand assets drawn as inline SVG by design - the one sanctioned
// exception, alongside mandated third-party logos, to the Lucide-only rule.

interface Silhouette {
  shape: keyof typeof SHAPES;
  left: string;
  width: number;
}

const SHAPES = {
  cup: {
    viewBox: "0 0 95 165",
    paths: (
      <>
        <path d="M12 6 h71 v27 c0 33 -16 51 -35 51 c-19 0 -36 -18 -36 -51 z" />
        <path d="M41 84 h13 l6 24 h-25 z" />
        <rect x="26" y="108" width="43" height="11" rx="3" />
        <rect x="18" y="119" width="59" height="46" rx="4" />
      </>
    ),
  },
  star: {
    viewBox: "0 0 60 117",
    paths: (
      <>
        <polygon points="30,4 37,21 56,22 42,34 46,52 30,42 14,52 18,34 4,22 23,21" />
        <rect x="24" y="52" width="12" height="42" rx="3" />
        <rect x="12" y="94" width="36" height="23" rx="4" />
      </>
    ),
  },
  medal: {
    viewBox: "0 0 75 90",
    paths: (
      <>
        <circle cx="37" cy="34" r="26" />
        <rect x="31" y="56" width="12" height="16" rx="3" />
        <rect x="17" y="72" width="41" height="18" rx="4" />
      </>
    ),
  },
  obelisk: {
    viewBox: "0 0 55 102",
    paths: (
      <>
        <rect x="20" y="4" width="15" height="60" rx="4" />
        <polygon points="27,0 34,12 21,12" />
        <rect x="10" y="64" width="35" height="16" rx="3" />
        <rect x="4" y="80" width="47" height="22" rx="4" />
      </>
    ),
  },
} as const;

const ARRANGEMENT: Silhouette[] = [
  { shape: "cup", left: "4%", width: 92 },
  { shape: "star", left: "13%", width: 58 },
  { shape: "medal", left: "20%", width: 72 },
  { shape: "obelisk", left: "30%", width: 54 },
  { shape: "cup", left: "38%", width: 78 },
  { shape: "medal", left: "55%", width: 66 },
  { shape: "cup", left: "63%", width: 96 },
  { shape: "star", left: "73%", width: 52 },
  { shape: "obelisk", left: "81%", width: 58 },
  { shape: "cup", left: "90%", width: 84 },
];

export function TrophyShelf() {
  return (
    <div className={styles.band} aria-hidden="true">
      <div className={styles.ledge} />
      <div className={styles.compartment}>
        {ARRANGEMENT.map((item, index) => {
          const { viewBox, paths } = SHAPES[item.shape];
          const [, , vw, vh] = viewBox.split(" ").map(Number);
          const height = Math.round((item.width * vh) / vw);
          return (
            <svg
              key={index}
              className={styles.silhouette}
              style={{ left: item.left, width: item.width, height }}
              viewBox={viewBox}
            >
              {paths}
            </svg>
          );
        })}
      </div>
    </div>
  );
}
