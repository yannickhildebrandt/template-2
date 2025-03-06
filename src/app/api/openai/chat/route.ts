import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, email } = await req.json();
  
  // If an email is directly provided, use it to create a specialized prompt
  let processedMessages = messages;
  
  if (email && messages.length === 1) {
    // This is the initial message with the email content
    processedMessages = [
      {
        role: "user",
        content: `I received the following email and need a professional, courteous response. 
        Please draft a complete reply that addresses all points and maintains a friendly, professional tone.
        
        EMAIL:
        ${email}`
      }
    ];
  }
  
  const result = await streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(processedMessages),
    system: "You are a professional email assistant. Your job is to help users craft perfect email responses or provide concise summaries. When drafting replies, be professional, clear, and courteous. When summarizing, extract key points and action items concisely.",
    temperature: 0.7,
    maxTokens: 1000,
  });

  return result.toDataStreamResponse();
}
