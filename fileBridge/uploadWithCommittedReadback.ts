export interface FileUploadResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
}

interface UploadWithCommittedReadbackOptions<TPersisted, TResponse extends FileUploadResponseLike> {
  upload: () => Promise<TResponse>;
  readPersisted: () => Promise<TPersisted | null>;
  expected: TPersisted;
  failureLabel: string;
}

export interface UploadWithCommittedReadbackResult<TPersisted, TResponse extends FileUploadResponseLike> {
  response: TResponse;
  recovered: TPersisted | null;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function readResponseError(response: FileUploadResponseLike): Promise<string> {
  try {
    const message = (await response.text()).trim();
    return message || `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

/**
 * Some SillyTavern file endpoints commit the upload and then fail while creating
 * the response path. Only accept that ambiguous failure when an exact read-back
 * proves that the intended JSON payload is already persisted.
 */
export async function uploadWithCommittedReadback<TPersisted, TResponse extends FileUploadResponseLike>({
  upload,
  readPersisted,
  expected,
  failureLabel,
}: UploadWithCommittedReadbackOptions<TPersisted, TResponse>): Promise<
  UploadWithCommittedReadbackResult<TPersisted, TResponse>
> {
  const response = await upload();
  if (response.ok) return { response, recovered: null };

  const responseError = await readResponseError(response);
  try {
    const persisted = await readPersisted();
    if (persisted !== null && sameJsonValue(persisted, expected)) {
      return { response, recovered: persisted };
    }
  } catch {
    // Preserve the authoritative upload error when the reconciliation read also fails.
  }

  throw new Error(`${failureLabel}：${responseError}`);
}
