import { describe, it, expect } from "vite-plus/test";
import {
  getModuleByKey,
  getNextModule,
  getPreviousModule,
  getCoreModules,
  getLabModules,
  getRecommendedModule,
  getModuleBadgeLabel,
} from "./storyHelpers";

describe("getModuleByKey", () => {
  it("returns the module for a valid key", () => {
    const mod = getModuleByKey("hash");
    expect(mod).toBeDefined();
    expect(mod!.title).toBe("Hash Playground");
  });

  it("returns undefined for an unknown key", () => {
    expect(getModuleByKey("nonexistent")).toBeUndefined();
  });
});

describe("getNextModule", () => {
  it("returns keys after hash", () => {
    expect(getNextModule("hash")?.key).toBe("keys");
  });

  it("returns blockchain after utxo", () => {
    expect(getNextModule("utxo")?.key).toBe("blockchain");
  });

  it("returns null for the last core module", () => {
    expect(getNextModule("descriptors")).toBeNull();
  });

  it("returns null for attacks (lab module)", () => {
    expect(getNextModule("attacks")).toBeNull();
  });

  it("returns null for an unknown key", () => {
    expect(getNextModule("nonexistent")).toBeNull();
  });
});

describe("getPreviousModule", () => {
  it("returns hash before keys", () => {
    expect(getPreviousModule("keys")?.key).toBe("hash");
  });

  it("returns null for the first core module", () => {
    expect(getPreviousModule("hash")).toBeNull();
  });

  it("returns null for attacks", () => {
    expect(getPreviousModule("attacks")).toBeNull();
  });
});

describe("getCoreModules", () => {
  it("returns 7 core modules", () => {
    const core = getCoreModules();
    expect(core).toHaveLength(7);
    expect(core.every((m) => m.storyGroup === "core")).toBe(true);
  });

  it("does not include attacks", () => {
    const keys = getCoreModules().map((m) => m.key);
    expect(keys).not.toContain("attacks");
  });
});

describe("getLabModules", () => {
  it("returns 1 lab module", () => {
    const labs = getLabModules();
    expect(labs).toHaveLength(1);
    expect(labs[0].key).toBe("attacks");
  });
});

describe("getRecommendedModule", () => {
  it("returns hash when nothing is completed", () => {
    expect(getRecommendedModule([])?.key).toBe("hash");
  });

  it("returns keys when hash is completed", () => {
    expect(getRecommendedModule(["hash"])?.key).toBe("keys");
  });

  it("returns utxo when hash and keys are completed", () => {
    expect(getRecommendedModule(["hash", "keys"])?.key).toBe("utxo");
  });

  it("returns null when all core modules are completed", () => {
    expect(
      getRecommendedModule([
        "hash",
        "keys",
        "utxo",
        "blockchain",
        "hd-wallet",
        "multisig",
        "descriptors",
      ]),
    ).toBeNull();
  });

  it("ignores non-core completed modules", () => {
    expect(getRecommendedModule(["attacks"])?.key).toBe("hash");
  });
});

describe("getModuleBadgeLabel", () => {
  const hash = getModuleByKey("hash")!;
  const keys = getModuleByKey("keys")!;
  const attacks = getModuleByKey("attacks")!;
  const utxo = getModuleByKey("utxo")!;

  it("returns Current when module matches currentModuleKey", () => {
    expect(getModuleBadgeLabel(hash, [], "hash")).toBe("Current");
  });

  it("returns Completed when module is in completedModules", () => {
    expect(getModuleBadgeLabel(hash, ["hash"])).toBe("Completed");
  });

  it("returns Side Lab for attack lab", () => {
    expect(getModuleBadgeLabel(attacks, [])).toBe("Side Lab");
  });

  it("returns Recommended for the first uncompleted core module", () => {
    expect(getModuleBadgeLabel(hash, [])).toBe("Recommended");
  });

  it("returns Not started for a core module that is not recommended", () => {
    expect(getModuleBadgeLabel(utxo, [])).toBe("Not started");
  });

  it("returns Recommended for keys when hash is completed", () => {
    expect(getModuleBadgeLabel(keys, ["hash"])).toBe("Recommended");
  });

  it("Current takes priority over Completed", () => {
    expect(getModuleBadgeLabel(hash, ["hash"], "hash")).toBe("Current");
  });
});
