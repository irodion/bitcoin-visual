import { describe, it, expect, beforeEach } from "vite-plus/test";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeReviewChallenge, type CodeReviewChallengeData } from "./CodeReviewChallenge";
import { useProgressStore } from "../stores/useProgressStore";

const MOCK_CHALLENGE: CodeReviewChallengeData = {
  moduleKey: "test-mod",
  title: "Review: test helper",
  prompt: "Which version is correct?",
  referenceInput: new TextEncoder().encode("test-input"),
  options: [
    {
      key: "A",
      label: "Version A",
      code: "byte[] result = sha256(sha256(input));\nreturn result;",
      computeDigest: () => new Uint8Array(32).fill(0xaa),
    },
    {
      key: "B",
      label: "Version B",
      code: "byte[] result = sha256(input);\nreturn result;",
      computeDigest: () => new Uint8Array(32).fill(0xbb),
    },
    {
      key: "C",
      label: "Version C",
      code: "byte[] first = sha256(input);\nbyte[] second = sha256(input);\nreturn second;",
      computeDigest: () => new Uint8Array(32).fill(0xcc),
    },
  ],
  correctKey: "A",
  reveal: {
    summary: "A is correct because it double-hashes.",
    details: "B is single hash, C hashes the original twice.",
    dangerNote: "Both wrong versions produce stable outputs.",
  },
};

beforeEach(() => {
  useProgressStore.getState().reset();
});

describe("CodeReviewChallenge", () => {
  it("renders title, prompt, and three options", async () => {
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    expect(screen.getByText("Review: test helper")).toBeInTheDocument();
    expect(screen.getByText("Which version is correct?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version A" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version B" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Version C" })).toBeInTheDocument();
  });

  it("has a radiogroup with correct label", async () => {
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    expect(screen.getByRole("radiogroup", { name: "Code options" })).toBeInTheDocument();
  });

  it("submit button is disabled when nothing selected", async () => {
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    const submit = screen.getByRole("button", { name: "Submit answer" });
    expect(submit).toBeDisabled();
  });

  it("selecting an option enables submit and updates aria-checked", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    const optionA = screen.getByRole("radio", { name: "Version A" });
    expect(optionA).toHaveAttribute("aria-checked", "false");

    await user.click(optionA);
    expect(optionA).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Submit answer" })).not.toBeDisabled();
  });

  it("submitting correct answer shows success banner", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Correct — nice catch!")).toBeInTheDocument();
    expect(screen.getByText("A is correct because it double-hashes.")).toBeInTheDocument();
  });

  it("submitting wrong answer shows incorrect banner", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version B" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Not quite — check the dataflow")).toBeInTheDocument();
  });

  it("correct answer marks challenge completed in store", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(useProgressStore.getState().completedChallenges).toContain("test-mod");
  });

  it("wrong answer does not mark challenge completed", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version C" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(useProgressStore.getState().completedChallenges).not.toContain("test-mod");
  });

  it("shows reveal explanation and danger note after submit", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText(/B is single hash/)).toBeInTheDocument();
    expect(screen.getByText(/Both wrong versions produce stable outputs/)).toBeInTheDocument();
  });

  it("shows computed digests in reveal", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Computed digests for comparison")).toBeInTheDocument();
  });

  it("try again resets to selection state", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByText("Correct — nice catch!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    // Back to initial state — submit button present and disabled; wait for exit animation
    const submitBtn = await screen.findByRole("button", { name: "Submit answer" });
    expect(submitBtn).toBeDisabled();
    await waitFor(() =>
      expect(screen.queryByText("Correct — nice catch!")).not.toBeInTheDocument(),
    );
  });

  it("shows previously-answered badge when challenge already completed", async () => {
    useProgressStore.getState().markChallengeCompleted("test-mod");

    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    expect(screen.getByText("Previously answered")).toBeInTheDocument();
  });

  it("keyboard arrow navigation moves selection between options", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    // Focus the first option
    const optionA = screen.getByRole("radio", { name: "Version A" });
    await user.click(optionA);
    expect(optionA).toHaveAttribute("aria-checked", "true");

    // ArrowDown moves to B
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Version B" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(optionA).toHaveAttribute("aria-checked", "false");

    // ArrowDown moves to C
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Version C" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ArrowDown wraps to A
    await user.keyboard("{ArrowDown}");
    expect(optionA).toHaveAttribute("aria-checked", "true");
  });

  it("options are disabled after submit", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<CodeReviewChallenge challenge={MOCK_CHALLENGE} />);
    });

    await user.click(screen.getByRole("radio", { name: "Version A" }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    await screen.findByText("Correct — nice catch!");

    expect(screen.getByRole("radio", { name: "Version A" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Version B" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Version C" })).toBeDisabled();
  });
});
