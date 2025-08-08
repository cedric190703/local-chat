import { ChatOllama } from "@langchain/ollama"
import { RunnableSequence } from "@langchain/core/runnables"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { documentProcessor, type DocumentChunk } from "./document-service"
import type { BaseMessage } from "@langchain/core/messages"

/**
 * Simple retrieval using in-memory chunks from DocumentProcessor.
 * In a real app, plug in a VectorStoreRetriever here.
 */
export async function retrieveRelevantChunks(query: string, k: number = 5): Promise<DocumentChunk[]> {
  return await documentProcessor.searchDocuments(query, k)
}

export interface RagOptions {
  modelName: string
}

export async function runRag(
  query: string,
  history: BaseMessage[],
  { modelName }: RagOptions
): Promise<string> {
  const model = new ChatOllama({ baseUrl: "http://localhost:11434", model: modelName, temperature: 0.3 })
  const chunks = await retrieveRelevantChunks(query, 5)
  const context = chunks.map((c, i) => `(${i + 1}/${chunks.length}) [${c.metadata.source}] ${c.content}`).join("\n\n")

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful assistant. Use the provided CONTEXT to answer the user. If the answer is not in the context, say you don't know.`],
    ["system", `CONTEXT:\n\n{context}`],
    new MessagesPlaceholder("history"),
    ["human", "{question}"]
  ])

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ])

  const answer = await chain.invoke({
    context,
    history,
    question: query,
  })

  return answer
}