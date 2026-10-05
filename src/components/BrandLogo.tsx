import { SHAPES } from "./TrophyShelf";
import styles from "./BrandLogo.module.css";

// Header lockup: a one-compartment trophy cabinet beside the wordmark. The
// silhouettes are brand assets drawn as inline SVG, the same sanctioned
// exception TrophyShelf uses.

interface MarkItem {
  shape: keyof typeof SHAPES;
  height: number;
}

const MARK: MarkItem[] = [
  { shape: "medal", height: 16 },
  { shape: "cup", height: 28 },
  { shape: "star", height: 21 },
];

export function BrandLogo() {
  return (
    <span className={styles.lockup}>
      <span className={styles.mark} aria-hidden="true">
        <span className={styles.row}>
          {MARK.map((item, index) => {
            const { viewBox, paths } = SHAPES[item.shape];
            const [, , vw, vh] = viewBox.split(" ").map(Number);
            return (
              <svg
                key={index}
                className={styles.silhouette}
                style={{ height: item.height, width: Math.round((item.height * vw) / vh) }}
                viewBox={viewBox}
              >
                {paths}
              </svg>
            );
          })}
        </span>
        <span className={styles.ledge} />
      </span>
      <span className={styles.wordmark}>Trophy Rooms</span>
    </span>
  );
}
