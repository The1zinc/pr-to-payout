import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { CreateBountyForm } from "@/components/create-bounty-form";

describe("CreateBountyForm", () => {
  it("submits a valid bounty draft", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateBountyForm
        initialValues={{
          title: "Add hero",
          description: "Add a new homepage hero and make the CTA clearer.",
          repoUrl: "https://github.com/acme/site",
          acceptanceCriteria:
            "The homepage must include a hero headline, body copy, and a clear CTA on desktop and mobile.",
          payoutAmountGen: "1.25",
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create bounty/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Add hero",
        repoUrl: "https://github.com/acme/site",
      }),
    );
  });
});
