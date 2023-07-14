import Fastify from "fastify";
import cors from "@fastify/cors"
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = Fastify();
const prisma = new PrismaClient();

app.register(cors, {
  origin: true
});

app.get("/", (_, reply) => {
  return reply.code(200).send("Welcome to Secret Word API!");
});

app.get("/v1/words", async (_, reply) => {
  const words = await prisma.word.findMany();

  if (words.length <= 0) {
    return reply.code(404).send({ message: "No words found!" });
  }

  return reply.code(200).send(words);
});

app.post("/v1/word", async (request, reply) => {
  const wordSchema = z.object({
    word: z.string(),
    definition: z.string(),
  });

  const { word, definition } = wordSchema.parse(request.body);

  const wordExists = await prisma.word.findUnique({
    where: { word },
  });

  if (wordExists) {
    return reply.code(409).send({ message: "Word already exists!" });
  }

  await prisma.word.create({
    data: {
      word,
      definition,
    },
  });

  return reply.code(201).send();
});

app.delete("/v1/word/:id", async (request, reply) => {
  const schema = z.object({
    id: z.string(),
  });

  const { id } = schema.parse(request.params);

  const word = await prisma.word.findUnique({
    where: { id: Number(id) },
  });

  if (!word) {
    return reply.code(404).send({ message: "Word not found!" });
  }

  const deletedWord = await prisma.word.delete({
    where: { id: Number(id) },
  });

  return reply.code(200).send(deletedWord);
});

app.get("/v1/random", async (_, reply) => {
  const count = await prisma.word.count();

  if (count <= 0) {
    return reply.code(404).send({ message: "No words found!" });
  }

  const wordIndex = Math.floor(Math.random() * count);

  const words = await prisma.word.findMany();
  const word = words[wordIndex];

  return reply.code(200).send(word);
});

app
  .listen({
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log("HTTP Server Running");
  });
