import { getABVariant } from "@/lib/ab";
import { getPrimaryModel, getReasoningModel, getPrimaryModelName } from "@/ai/providers";

export function getChatExperiment(userKey: string) {
  const variant = getABVariant(userKey);

  const model = variant === "A"
    ? getPrimaryModel()
    : getReasoningModel();

  const modelName = variant === "A"
    ? getPrimaryModelName()
    : "deepseek/deepseek-reasoner (OpenRouter)";

  return { experiment: "chat_model_v1" as const, variant, model, modelName };
}
