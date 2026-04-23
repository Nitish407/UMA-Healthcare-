import OpenAI from "openai";

export async function handler(event) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { message } = JSON.parse(event.body);

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "You are a helpful healthcare assistant." },
      { role: "user", content: message }
    ],
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      reply: response.choices[0].message.content
    }),
  };
}
