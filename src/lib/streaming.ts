// Type for structured AI response (matches RESPONSE_SCHEMA in openai.ts)
export interface AIResponse {
  status: "success" | "error";
  text: string;
  reason: string;
}

export type StreamStatus = "success" | "error" | null;

export interface StreamCallbacks {
  onDelta: (content: string) => void;
  onComplete: (result: AIResponse) => void;
  onError: (message: string) => void;
}

/**
 * Format data as SSE message
 */
export function formatSSEMessage(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Detect "success" or "error" status from partial JSON
 */
export function detectResponseStatus(json: string): StreamStatus {
  const statusMarker = '"status":"';
  const statusIndex = json.indexOf(statusMarker);
  if (statusIndex !== -1) {
    const afterStatus = json.slice(statusIndex + statusMarker.length);
    if (afterStatus.startsWith("success")) {
      return "success";
    } else if (afterStatus.startsWith("error")) {
      return "error";
    }
  }
  return null;
}

/**
 * Process JSON escape sequences and return the unescaped character.
 * Returns null if the escape sequence is incomplete.
 */
export function processEscapedChar(
  char: string,
  nextChar: string | undefined
): string | null {
  if (nextChar === undefined) {
    return null; // Incomplete escape
  }
  switch (nextChar) {
    case "n":
      return "\n";
    case "t":
      return "\t";
    case '"':
      return '"';
    case "\\":
      return "\\";
    default:
      return nextChar;
  }
}

interface ParseTextResult {
  text: string;
  endFound: boolean;
  charsProcessed: number;
}

/**
 * Parse text field content handling JSON escape sequences.
 * Returns the unescaped text, whether the end quote was found, and chars processed.
 */
export function parseTextContent(content: string): ParseTextResult {
  let text = "";
  let i = 0;
  let endFound = false;

  while (i < content.length) {
    if (content[i] === "\\") {
      const result = processEscapedChar(content[i], content[i + 1]);
      if (result === null) {
        break; // Incomplete escape, wait for more data
      }
      text += result;
      i += 2;
    } else if (content[i] === '"') {
      endFound = true;
      break;
    } else {
      text += content[i];
      i++;
    }
  }

  return { text, endFound, charsProcessed: i };
}

interface StreamProcessorOptions {
  onDelta?: (content: string) => void;
  onSuccess?: (
    result: AIResponse,
    streamController: ReadableStreamDefaultController
  ) => void;
  onError?: (message: string) => void;
}

/**
 * Create a stream processor for OpenAI streaming responses.
 * Handles SSE parsing, JSON escape sequences, and status detection.
 */
export function createOpenAIStreamProcessor(
  response: Response,
  options: StreamProcessorOptions
): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(streamController) {
      const reader = response.body!.getReader();
      let fullJson = "";
      let detectedStatus: StreamStatus = null;
      let inTextField = false;
      let textContent = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (!delta) continue;

              fullJson += delta;

              // First, detect status before streaming any text
              if (detectedStatus === null) {
                detectedStatus = detectResponseStatus(fullJson);
              }

              // Only stream text if status is "success"
              if (detectedStatus !== "success") {
                continue;
              }

              // Stream text as it arrives
              if (!inTextField) {
                const textMarker = '"text":"';
                const markerIndex = fullJson.indexOf(textMarker);
                if (markerIndex !== -1) {
                  inTextField = true;
                  const afterMarker = fullJson.slice(
                    markerIndex + textMarker.length
                  );
                  const result = parseTextContent(afterMarker);
                  textContent = result.text;
                  if (result.text) {
                    options.onDelta?.(result.text);
                    streamController.enqueue(
                      encoder.encode(
                        formatSSEMessage({ type: "delta", content: result.text })
                      )
                    );
                  }
                  if (result.endFound) {
                    inTextField = false;
                  }
                }
              } else {
                // Already in text field, process new delta
                const result = parseTextContent(delta);
                if (result.text) {
                  textContent += result.text;
                  options.onDelta?.(result.text);
                  streamController.enqueue(
                    encoder.encode(
                      formatSSEMessage({ type: "delta", content: result.text })
                    )
                  );
                }
                if (result.endFound) {
                  inTextField = false;
                }
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }

        // Parse the complete JSON response
        let parsedResponse: AIResponse;
        try {
          parsedResponse = JSON.parse(fullJson);
        } catch {
          options.onError?.("Invalid response from AI");
          streamController.enqueue(
            encoder.encode(
              formatSSEMessage({ type: "error", message: "Invalid response from AI" })
            )
          );
          streamController.close();
          return;
        }

        // Handle AI refusal for nonsensical input
        if (parsedResponse.status === "error") {
          options.onError?.("Couldn't improve this text");
          streamController.enqueue(
            encoder.encode(
              formatSSEMessage({
                type: "done",
                status: "error",
                message:
                  "Couldn't improve this text. Try entering a sentence or phrase.",
              })
            )
          );
          streamController.close();
          return;
        }

        // Send completion for success
        streamController.enqueue(
          encoder.encode(
            formatSSEMessage({
              type: "done",
              status: "success",
              improvedText: parsedResponse.text,
            })
          )
        );

        // Allow caller to add additional data before closing
        options.onSuccess?.(parsedResponse, streamController);

        streamController.close();
      } catch (err) {
        console.error("Stream processing error:", err);
        options.onError?.("Stream processing failed");
        streamController.enqueue(
          encoder.encode(
            formatSSEMessage({ type: "error", message: "Stream processing failed" })
          )
        );
        streamController.close();
      }
    },
  });
}

/**
 * Send additional SSE data to an existing stream controller
 */
export function sendSSEData(
  streamController: ReadableStreamDefaultController,
  data: object
): void {
  const encoder = new TextEncoder();
  streamController.enqueue(encoder.encode(formatSSEMessage(data)));
}

// ============================================================================
// Client-side SSE utilities
// ============================================================================

export interface SSECallbacks<T> {
  onMessage: (message: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Process an SSE stream from a fetch Response.
 * Parses each "data: {...}" line and calls onMessage with the parsed object.
 */
export async function processSSEResponse<T>(
  response: Response,
  callbacks: SSECallbacks<T>
): Promise<void> {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (!data) continue;

        try {
          const message = JSON.parse(data) as T;
          callbacks.onMessage(message);
        } catch {
          // Ignore JSON parse errors for incomplete/invalid chunks
        }
      }
    }
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}
