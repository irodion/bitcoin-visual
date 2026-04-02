import { BTN_PRIMARY, BTN_GHOST, SECTION_LABEL } from "../../../shared/components/styles.ts";
import { NUMSConstantsPanel } from "../components/NUMSConstantsPanel.tsx";
import { CollisionBucketViz } from "../components/CollisionBucketViz.tsx";
import { useBirthdayDemo } from "../hooks/useBirthdayDemo.ts";

interface DeepDiveTabProps {
  onInteract: () => void;
}

export function DeepDiveTab({ onInteract }: DeepDiveTabProps) {
  const birthday = useBirthdayDemo();

  return (
    <div className="space-y-6">
      <NUMSConstantsPanel onInteract={onInteract} />

      <section>
        <div className={SECTION_LABEL}>Birthday Paradox</div>

        <div className="mt-2 rounded-section border border-border bg-surface p-5 md:p-6">
          <p className="mb-4 text-sm text-text-secondary">
            With a full 256-bit hash, collisions are unfindable. But shrink the output to 8 bits
            (256 possible values) and they appear in seconds. This is the birthday paradox: the
            probability of a collision grows much faster than you'd expect.
          </p>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onInteract();
                birthday.setHashBits(8);
              }}
              className={birthday.hashBits === 8 ? BTN_PRIMARY : BTN_GHOST}
            >
              8-bit (256 slots)
            </button>
            <button
              type="button"
              onClick={() => {
                onInteract();
                birthday.setHashBits(16);
              }}
              className={birthday.hashBits === 16 ? BTN_PRIMARY : BTN_GHOST}
            >
              16-bit (65,536 slots)
            </button>
          </div>

          <CollisionBucketViz
            hashBits={birthday.hashBits}
            entries={birthday.entries}
            collision={birthday.collision}
            addOne={() => {
              onInteract();
              birthday.addOne();
            }}
            addBatch={(n) => {
              onInteract();
              birthday.addBatch(n);
            }}
            reset={() => {
              onInteract();
              birthday.reset();
            }}
          />
        </div>
      </section>
    </div>
  );
}
