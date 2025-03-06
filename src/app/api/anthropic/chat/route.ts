import { AnthropicStream, StreamingTextResponse, Message } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { messages, apiKey: providedApiKey } = await req.json();
    
    // Use the provided API key or fall back to environment variable
    const apiKey = providedApiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No API key provided',
          message: 'Please add your Anthropic API key in settings',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${messages.length} messages with Claude 3 Sonnet`);
    
    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(message => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    }));
    
    // Make the API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: anthropicMessages,
        max_tokens: 4000,
        stream: true,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', errorData);
      
      return new Response(
        JSON.stringify({
          error: 'Anthropic API error',
          message: errorData.error?.message || response.statusText,
          status: response.status,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a stream from the response
    const stream = AnthropicStream(response);
    
    // Return a streaming response
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
