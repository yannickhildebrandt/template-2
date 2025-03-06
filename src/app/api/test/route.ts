import { StreamingTextResponse } from 'ai';

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Create a simple text encoder for streaming
    const encoder = new TextEncoder();
    
    // Create a simple test message
    const testMessage = "This is a test response from the server. Your API connection is working correctly. The frontend can now receive streamed responses from the backend. This demonstrates that the stream is properly connected and displaying content.";
    
    // Create a ReadableStream that will emit the test message in chunks
    const stream = new ReadableStream({
      async start(controller) {
        // Split message into parts to simulate streaming
        const parts = testMessage.split('. ');
        
        for (const part of parts) {
          // Add a small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send the text chunk with its period (except for the last chunk)
          controller.enqueue(encoder.encode(part + (part === parts[parts.length - 1] ? '' : '. ')));
        }
        
        // End the stream
        controller.close();
      }
    });

    // Return a streaming response using the AI SDK's helper
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Test API error:", error);
    return new Response(
      JSON.stringify({
        error: "Test API failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 