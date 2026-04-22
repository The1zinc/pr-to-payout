import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { SubmissionForm } from "@/components/submission-form";

describe("SubmissionForm", () => {
  it("submits valid PR and deployment evidence", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmissionForm
        allowedDomains={["vercel.app"]}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/github pr url/i), {
      target: { value: "https://github.com/acme/site/pull/42" },
    });
    fireEvent.change(screen.getByLabelText(/deployment url/i), {
      target: { value: "https://feature-site.vercel.app" },
    });
    fireEvent.change(screen.getByLabelText(/optional note/i), {
      target: { value: "Implemented the requested CTA and layout changes." },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit proof/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
