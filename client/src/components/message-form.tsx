import { ChevronRight } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { createRoomMessage } from "../http/create-room-message";

export function MessageForm() {
  const { roomId } = useParams();

  if (!roomId) {
    throw new Error("Message form component must be used within room page");
  }

  async function handleCreateRoomMessage(data: FormData) {
    const message = data.get("message")?.toString();

    if (!message || !roomId) return;

    try {
      await createRoomMessage(roomId, { message });
    } catch {
      toast.error("Failed to create room message!");
    }
  }

  return (
    <form
      action={handleCreateRoomMessage}
      className="flex w-full items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 ring-orange-400 ring-offset-2 ring-offset-zinc-950 focus-within:ring-1"
    >
      <input
        required
        type="text"
        name="message"
        placeholder="What's your question?"
        autoComplete="off"
        className="flex-1 text-sm bg-transparent mx-2 outline-none text-zinc-100 placeholder:text-zinc-500"
      />

      <button
        type="submit"
        className="bg-orange-400 text-orange-950 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm transition-colors hover:bg-orange-500"
      >
        Create question
        <ChevronRight className="size-4" />
      </button>
    </form>
  );
}
