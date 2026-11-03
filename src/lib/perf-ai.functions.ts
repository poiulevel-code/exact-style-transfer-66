import { createServerFn } from "@tanstack/react-start";
import { validatePerfInput, type PerfInput } from "./perf-ai";

export const diagnosePerformance = createServerFn({ method: "POST" })
  .inputValidator((input: PerfInput) => validatePerfInput(input))
  .handler(async ({ data }) => {
    const { generateTextViaGateway, aiErrorMessage } = await import("./ai-gateway.server");
    const { PERF_INSTRUCTIONS, buildPerfPrompt } = await import("./perf-ai");
    try {
      return { ok: true as const, text: await generateTextViaGateway(PERF_INSTRUCTIONS, buildPerfPrompt(data)) };
    } catch (error) {
      console.error("diagnosePerformance failed", error);
      return { ok: false as const, error: aiErrorMessage(error) };
    }
  });
