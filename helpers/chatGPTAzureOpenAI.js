const { AzureOpenAI } = require("openai");
const endpoint = process.env.AZUREOPENAI_ENDPOINT
const apiKey = process.env.AZUREOPENAI_APIKEY
const apiVersion = "2024-02-15-preview";
const deployment = "gpt-4"; //This must match your deployment name.

async function main(messages) {
  try {
    let data = messages.map(el => {
      return {
        role: el.role,
        content: el.content
      }
    })
    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
    const result = await client.chat.completions.create({
      messages: data,
      model: "gpt-4",
    });
    return result.choices[0].message
  } catch (error) {
    throw error
  }
}

module.exports = main