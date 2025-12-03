import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are Cosos, an AI business intelligence assistant. You help founders and CEOs understand their business context by answering questions based on their connected data sources (Slack, Notion, documents, etc.).

Your role is to:
1. Provide clear, actionable insights based on the available context
2. Connect dots between different pieces of information
3. Highlight relevant decisions, goals, and discussions
4. Be honest when you don't have enough information

Keep responses concise but comprehensive. Use bullet points for clarity when appropriate.`;

export async function POST(req: Request) {
  const { messages, userId, conversationId } = await req.json();

  // Get the latest user message for context retrieval
  const latestMessage = messages[messages.length - 1]?.content || "";

  // Retrieve relevant context from Python backend
  let contextStr = "";
  try {
    const contextResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/context/retrieve?user_id=${userId}&query=${encodeURIComponent(latestMessage)}&limit=10`,
      { method: "GET" }
    );

    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      if (contextData.context && contextData.context.length > 0) {
        contextStr = contextData.context
          .map(
            (item: { type: string; text: string }) =>
              `[${item.type}]: ${item.text}`
          )
          .join("\n\n---\n\n");
      }
    }
  } catch (error) {
    console.error("Failed to retrieve context:", error);
  }

  // Build the augmented messages with context
  const augmentedMessages = [...messages];
  if (contextStr) {
    // Insert context before the last user message
    const lastUserMsgIndex = augmentedMessages.length - 1;
    augmentedMessages[lastUserMsgIndex] = {
      ...augmentedMessages[lastUserMsgIndex],
      content: `Based on the following business context, answer the question.

CONTEXT:
${contextStr}

QUESTION: ${latestMessage}

Provide a clear, actionable answer. If the context doesn't contain enough information, say so.`,
    };
  }

  // Stream the response using AI SDK
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: augmentedMessages,
  });

  // Store conversation in background (don't block stream)
  if (userId) {
    storeConversation(userId, conversationId, messages).catch(console.error);
  }

  return result.toDataStreamResponse();
}

async function storeConversation(
  userId: string,
  conversationId: string | null,
  messages: Array<{ role: string; content: string }>
) {
  const title = messages[0]?.content?.slice(0, 100) || "New conversation";
  const now = new Date().toISOString();

  if (conversationId) {
    // Update existing conversation
    await supabase
      .from("context_conversations")
      .update({
        messages: messages.map((m) => ({ ...m, timestamp: now })),
        updated_at: now,
      })
      .eq("id", conversationId);
  } else {
    // Create new conversation
    await supabase.from("context_conversations").insert({
      user_id: userId,
      title,
      messages: messages.map((m) => ({ ...m, timestamp: now })),
    });
  }
}

