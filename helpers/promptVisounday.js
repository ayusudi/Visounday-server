const { AzureOpenAI } = require("openai");

const endpoint = process.env.AZUREOPENAI_ENDPOINT
const apiKey = process.env.AZUREOPENAI_APIKEY
const apiVersion = "2024-02-15-preview";
const deployment = "gpt-4";

async function main(url, frames) {
  try {
    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
    const result = await client.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content": "You are Visounday, an AI for video analysis to help content creators. You need to describe data JSON in text markdown and visualize the situation and sentiment and from the analyze create title caption for posting. Additionally, you need to give them background song recommendations."
        },
        {
          role: "user", content: JSON.stringify({ url, frames })
        }
      ],
      model: "gpt-4",
    });
    return result.choices[0].message
  } catch (error) {
    throw error
  }
}

module.exports = main