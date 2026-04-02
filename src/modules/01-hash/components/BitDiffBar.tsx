import { useMemo } from "react";

export function BitDiffBar({ original, modified }: { original: Uint8Array; modified: Uint8Array }) {
  const { groups, changed } = useMemo(() => {
    const result: { differs: boolean; count: number }[] = [];
    for (let i = 0; i < original.length; i++) {
      const xor = original[i] ^ modified[i];
      for (let bit = 7; bit >= 0; bit--) {
        const differs = ((xor >> bit) & 1) === 1;
        const last = result[result.length - 1];
        if (last && last.differs === differs) {
          last.count++;
        } else {
          result.push({ differs, count: 1 });
        }
      }
    }
    const diffCount = result.filter((g) => g.differs).reduce((s, g) => s + g.count, 0);
    return { groups: result, changed: diffCount };
  }, [original, modified]);

  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#131C2A]"
      role="img"
      aria-label={`Bit difference visualization: ${changed} of 256 bits differ`}
    >
      {groups.map((g, i) => (
        <div
          key={i}
          className={`h-full ${g.differs ? "bg-danger" : "bg-teal"}`}
          style={{ width: `${(g.count / 256) * 100}%` }}
        />
      ))}
    </div>
  );
}
