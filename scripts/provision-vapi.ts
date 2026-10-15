/**
 * Provision The Negotiator (HaggleOS) Voice Assistant on Vapi.ai
 */

import fs from "fs";
import path from "path";

const VAPI_KEY = "1ebe00ae-4fea-4534-a09e-98e8ddd25332";

async function provisionVapi() {
  console.log("Provisioning 'The Negotiator - HaggleOS Alex' on Vapi.ai...");

  const configPath = path.join(process.cwd(), "voice-agent", "vapi-assistant-config.json");
  const rawConfig = fs.readFileSync(configPath, "utf-8");
  const assistantConfig = JSON.parse(rawConfig);

  // Simplify tools structure for Vapi API compatibility
  const payload = {
    name: "The Negotiator - HaggleOS Alex",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.3,
      messages: assistantConfig.model.messages,
    },
    voice: {
      provider: "vapi",
      voiceId: "Elliot", // Default sharp, clear voice
    },
    firstMessage: "Hi, calling on behalf of the purchasing desk—looking to lock in an order today. Who handles commercial quotes?",
    recordingEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 300,
  };

  try {
    const res = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Vapi error: ${JSON.stringify(data)}`);
    }

    console.log("✅ Successfully created Assistant on Vapi!");
    console.log("Assistant ID:", data.id);
    console.log("Assistant Name:", data.name);

    // Update .env.local with assistant ID and API key
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(
      /VAPI_API_KEY=.*/,
      `VAPI_API_KEY=${VAPI_KEY}`
    );
    envContent = envContent.replace(
      /VAPI_ASSISTANT_ID=.*/,
      `VAPI_ASSISTANT_ID=${data.id}`
    );
    fs.writeFileSync(envPath, envContent, "utf-8");
    console.log("✅ Updated .env.local with VAPI_API_KEY and VAPI_ASSISTANT_ID");

    return data;
  } catch (err: any) {
    console.error("❌ Failed to provision assistant:", err.message);
  }
}

provisionVapi();
