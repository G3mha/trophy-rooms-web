# Lucide Icons

Always use [Lucide React](https://lucide.dev/icons/) icons in this project instead of:
- Emojis
- Inline SVGs
- Other icon libraries (FontAwesome, Material Icons, etc.)
- Unicode symbols

## Usage

```tsx
import { IconName } from "lucide-react";

// Basic usage
<IconName />

// With size
<IconName size={16} />

// With custom class
<IconName className={styles.icon} />

// With color
<IconName color="var(--nintendo-red)" />
```

## Common Icons

| Use Case | Icon |
|----------|------|
| Chevron down | `ChevronDown` |
| Chevron up | `ChevronUp` |
| Chevron left | `ChevronLeft` |
| Chevron right | `ChevronRight` |
| Close/X | `X` |
| Menu | `Menu` |
| Search | `Search` |
| Settings | `Settings` |
| User | `User` |
| Home | `Home` |
| Trophy | `Trophy` |
| Gamepad | `Gamepad2` |
| Star | `Star` |
| Heart | `Heart` |
| Check | `Check` |
| Plus | `Plus` |
| Minus | `Minus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Loading | `Loader2` (animate with `animate-spin`) |

## For Select Dropdowns

Wrap selects with a positioned container and add the ChevronDown icon:

```tsx
import { ChevronDown } from "lucide-react";

<div className={styles.selectWrapper}>
  <select className={styles.select}>
    <option>Option 1</option>
  </select>
  <ChevronDown className={styles.selectIcon} size={16} />
</div>
```

```css
.selectWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select {
  appearance: none;
  padding-right: 36px;
}

.selectIcon {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--text-muted);
}
```

## Finding Icons

Browse all available icons at: https://lucide.dev/icons/
