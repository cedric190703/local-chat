import { ChatOllama } from "@langchain/ollama";
import "dotenv/config";

function createModel(modelName: string) {
  return new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    temperature: 0.3,
  });
}

