import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sha256d } from "../../shared/crypto/hash.ts";
import { buildMerkleTree, getMerkleProof } from "../../shared/crypto/merkle.ts";
import { computeMerkleRoot } from "../../shared/crypto/merkle.ts";
import type { BlockData, MockTransaction } from "./constants.ts";
import { MerkleTreePanel } from "./MerkleTreePanel.tsx";

function txDataToTxid(data: string): Uint8Array {
  return sha256d(new TextEncoder().encode(data));
}

function makeTx(data: string): MockTransaction {
  return { id: crypto.randomUUID(), data, txid: txDataToTxid(data) };
}

function makeBlock(txTexts: string[]): {
  block: BlockData;
  merkleTree: Uint8Array[][];
} {
  const transactions = txTexts.map(makeTx);
  const txids = transactions.map((tx) => tx.txid);
  const merkleTree = buildMerkleTree(txids);
  const block: BlockData = {
    index: 0,
    version: 1,
    prevHash: new Uint8Array(32),
    transactions,
    merkleRoot: computeMerkleRoot(txids),
    timestamp: Date.now() / 1000,
    difficultyBits: 1,
    nonce: 0,
    hash: new Uint8Array(32),
  };
  return { block, merkleTree };
}

describe("MerkleTreePanel", () => {
  it("AC: renders all tree nodes for a 4-tx block", async () => {
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={null}
          merkleProof={null}
          onSelectTransaction={vi.fn()}
        />,
      );
    });
    // 4 leaves + 2 mid + 1 root = 7 buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(7);
  });

  it("AC: MerkleTreeConnectors mounts without crashing", async () => {
    // jsdom has no layout engine, so getBoundingClientRect returns zeros
    // and the SVG overlay returns null. We verify the component mounts cleanly.
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const { container } = await act(async () =>
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={null}
          merkleProof={null}
          onSelectTransaction={vi.fn()}
        />,
      ),
    );
    // The relative container for the tree exists
    const treeContainer = container.querySelector(".relative");
    expect(treeContainer).not.toBeNull();
  });

  it("AC: Walk Proof button appears only with active proof", async () => {
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    // Without proof: no Walk Proof button
    const { unmount } = await act(async () =>
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={null}
          merkleProof={null}
          onSelectTransaction={vi.fn()}
        />,
      ),
    );
    expect(screen.queryByRole("button", { name: /walk/i })).not.toBeInTheDocument();
    unmount();

    // With proof: Walk Proof button present
    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });
    expect(screen.getByRole("button", { name: /walk through proof steps/i })).toBeInTheDocument();
  });

  it("AC: step-through controls appear after clicking Walk Proof", async () => {
    const user = userEvent.setup();
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });

    // Initially no step counter
    expect(screen.queryByText(/1 \/ 2/)).not.toBeInTheDocument();

    // Click Walk Proof
    await user.click(screen.getByRole("button", { name: /walk through proof steps/i }));

    // Step controls appear
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next proof step/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous proof step/i })).toBeInTheDocument();
  });

  it("AC: stepping forward advances the step counter", async () => {
    const user = userEvent.setup();
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });

    await user.click(screen.getByRole("button", { name: /walk through proof steps/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next proof step/i }));
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
  });

  it("AC: reset returns to step 1", async () => {
    const user = userEvent.setup();
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });

    await user.click(screen.getByRole("button", { name: /walk through proof steps/i }));
    await user.click(screen.getByRole("button", { name: /next proof step/i }));
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset proof walk/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
  });

  it("AC: Show All exits walk mode", async () => {
    const user = userEvent.setup();
    const { block, merkleTree } = makeBlock(["tx0", "tx1", "tx2", "tx3"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });

    await user.click(screen.getByRole("button", { name: /walk through proof steps/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();

    // "Show All" button replaces "Walk Proof" when in walk mode
    await user.click(screen.getByRole("button", { name: /show all proof steps/i }));
    // Step counter (e.g. "Step 1/2") should disappear
    expect(screen.queryByText(/1 \/ 2/)).not.toBeInTheDocument();
  });

  it("AC: single-tx tree shows no walk controls", async () => {
    const { block, merkleTree } = makeBlock(["only-tx"]);
    const txids = block.transactions.map((tx) => tx.txid);
    const proof = getMerkleProof(txids, 0);

    await act(async () => {
      render(
        <MerkleTreePanel
          block={block}
          merkleTree={merkleTree}
          selectedTxIndex={0}
          merkleProof={proof}
          onSelectTransaction={vi.fn()}
        />,
      );
    });
    // Single leaf has empty proof — no walk controls
    expect(screen.queryByRole("button", { name: /walk/i })).not.toBeInTheDocument();
  });
});
