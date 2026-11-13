import styles from "./TrophyShelf.module.css";

// Trophy cabinet silhouette band (see .claude/skills/trophy-cabinet-design).
// These are brand assets drawn as inline SVG by design - the one sanctioned
// exception, alongside mandated third-party logos, to the Lucide-only rule.

// Every shape is a flat ink silhouette. Detail comes from the outline
// (handles, knops, flared feet, cut-out rings), never from shading.
const SHAPES = {
  cup: {
    viewBox: "0 0 120 170",
    paths: (
      <>
        <rect x="23" y="6" width="74" height="6" rx="3" />
        <path d="M27 11 H93 C93 46 80 70 66 79 H54 C40 70 27 46 27 11 Z" />
        <path d="M29 20 C8 17 5 47 37 55" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M91 20 C112 17 115 47 83 55" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <rect x="55" y="78" width="10" height="16" />
        <ellipse cx="60" cy="96" rx="10" ry="5" />
        <path d="M56 99 H64 C64 112 72 120 81 124 H39 C48 120 56 112 56 99 Z" />
        <rect x="35" y="123" width="50" height="6" rx="3" />
        <path d="M35 129 H85 L89 159 H31 Z" />
        <rect x="24" y="158" width="72" height="12" rx="2" />
      </>
    ),
  },
  star: {
    viewBox: "0 0 70 130",
    paths: (
      <>
        <polygon points="35,2 42.05,21.29 62.58,22.04 46.41,34.71 52.05,54.46 35,43 17.95,54.46 23.59,34.71 7.42,22.04 27.95,21.29" />
        <path d="M31 42 H39 L41 91 H29 Z" />
        <rect x="24" y="90" width="22" height="5" rx="2.5" />
        <path d="M22 95 H48 L52 118 H18 Z" />
        <rect x="13" y="117" width="44" height="13" rx="2" />
      </>
    ),
  },
  medal: {
    viewBox: "0 0 80 100",
    paths: (
      <>
        <path
          fillRule="evenodd"
          d="M40 5 a27 27 0 1 0 0 54 a27 27 0 1 0 0 -54 Z M40 9.5 a22.5 22.5 0 1 0 0 45 a22.5 22.5 0 1 0 0 -45 Z M40 11.5 a20.5 20.5 0 1 0 0 41 a20.5 20.5 0 1 0 0 -41 Z"
        />
        <path d="M36 57 H44 L46 72 H34 Z" />
        <rect x="27" y="71" width="26" height="5" rx="2.5" />
        <path d="M24 76 H56 L60 90 H20 Z" />
        <rect x="15" y="89" width="50" height="11" rx="2" />
      </>
    ),
  },
  shield: {
    viewBox: "0 0 80 110",
    paths: (
      <>
        <path
          fillRule="evenodd"
          d="M10 4 H70 V38 C70 60 55 72 40 79 C25 72 10 60 10 38 Z M14.5 8.5 H65.5 V38 C65.5 57 52.5 67.5 40 74 C27.5 67.5 14.5 57 14.5 38 Z M16.5 10.5 H63.5 V38 C63.5 55.5 51.5 65.5 40 71.5 C28.5 65.5 16.5 55.5 16.5 38 Z"
        />
        <path d="M36 77 H44 L46 88 H34 Z" />
        <path d="M24 88 H56 L60 100 H20 Z" />
        <rect x="15" y="99" width="50" height="11" rx="2" />
      </>
    ),
  },
} as const;

type Shape = keyof typeof SHAPES;

// Each bay is one compartment of the cabinet: [shape, base width in px].
const BAYS: [Shape, number][][] = [
  [["cup", 104], ["star", 56], ["medal", 74]],
  [["shield", 66], ["cup", 90]],
  [["medal", 68], ["cup", 110], ["star", 52]],
  [["shield", 68], ["cup", 96]],
];

interface CaseItem {
  shape: Shape;
  // Share of the row's width; height follows the shape's proportions
  width: string;
}

const CASE_ARRANGEMENT: CaseItem[] = [
  { shape: "medal", width: "15%" },
  { shape: "star", width: "11%" },
  { shape: "cup", width: "24%" },
  { shape: "shield", width: "14%" },
  { shape: "cup", width: "18%" },
];

// A single cabinet compartment for hero panels. Pass children (game covers)
// to stand them on the shelf; with none it falls back to trophy silhouettes,
// which sit in a flex row so the cluster scales with the panel.
export function TrophyCase({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.case} aria-hidden={children ? undefined : true}>
      {children ? (
        <div className={styles.caseCovers}>{children}</div>
      ) : (
        <div className={styles.caseRow}>
          {CASE_ARRANGEMENT.map((item, index) => {
            const { viewBox, paths } = SHAPES[item.shape];
            const [, , vw, vh] = viewBox.split(" ").map(Number);
            return (
              <svg
                key={index}
                className={styles.caseSilhouette}
                style={{ width: item.width, aspectRatio: `${vw} / ${vh}` }}
                viewBox={viewBox}
              >
                {paths}
              </svg>
            );
          })}
        </div>
      )}
      <div className={styles.caseShelf} />
    </div>
  );
}

export function TrophyShelf() {
  return (
    <div className={styles.band} aria-hidden="true">
      <div className={styles.crown} />
      <div className={styles.compartment}>
        {BAYS.map((bay, bayIndex) => (
          <div key={bayIndex} className={styles.bay} style={{ flexGrow: bay.length }}>
            {bay.map(([shape, width], index) => {
              const { viewBox, paths } = SHAPES[shape];
              const [, , vw, vh] = viewBox.split(" ").map(Number);
              return (
                <svg
                  key={index}
                  className={styles.silhouette}
                  style={{ "--w": width, aspectRatio: `${vw} / ${vh}` } as React.CSSProperties}
                  viewBox={viewBox}
                >
                  {paths}
                </svg>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.shelf} />
    </div>
  );
}
