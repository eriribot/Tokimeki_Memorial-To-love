let activeStoryGenerationId: string | null = null;

export async function runExclusiveStoryGeneration<T>(generationId: string, operation: () => Promise<T>): Promise<T> {
  if (activeStoryGenerationId !== null) {
    throw new Error(`已有剧情生成正在进行（${activeStoryGenerationId}），请等待完成后再试。`);
  }
  activeStoryGenerationId = generationId;
  try {
    return await operation();
  } finally {
    if (activeStoryGenerationId === generationId) activeStoryGenerationId = null;
  }
}

export function getActiveStoryGenerationId(): string | null {
  return activeStoryGenerationId;
}
