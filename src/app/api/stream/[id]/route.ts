import { NextRequest } from "next/server";
import { eventBus } from "@/lib/events";
import { Store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await context.params;

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial snapshot of campaign and calls
      const campaign = await Store.getCampaign(campaignId);
      const calls = await Store.getCallsForCampaign(campaignId);

      const initialPayload = JSON.stringify({
        type: "INIT",
        campaign,
        calls,
      });
      controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

      // Event listener for live updates
      const onCallUpdate = (data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (err) {
          console.warn("SSE enqueue error:", err);
        }
      };

      const onCampaignUpdate = (camp: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "CAMPAIGN_UPDATE", campaign: camp })}\n\n`
            )
          );
        } catch (err) {}
      };

      eventBus.on(`stream:${campaignId}`, onCallUpdate);
      eventBus.on(`campaign:${campaignId}`, onCampaignUpdate);

      // Keepalive heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(heartbeat);
        eventBus.off(`stream:${campaignId}`, onCallUpdate);
        eventBus.off(`campaign:${campaignId}`, onCampaignUpdate);
      });
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
