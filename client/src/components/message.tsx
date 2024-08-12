import { toast } from "sonner";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { createRoomMessageVote } from "../http/create-room-message-vote";
import { removeRoomMessageVote } from "../http/remove-room-message-vote";

type MessageProps = {
  id: string;
  text: string;
  votes?: number;
  disabled?: boolean;
};

export function Message({
  id,
  text,
  disabled = false,
  votes = 0,
}: MessageProps) {
  const [hasVoted, setHasVoted] = useState(false);

  const { roomId } = useParams();

  if (!roomId) {
    throw new Error("Message component must be used within room page");
  }

  function handleToggleRoomMessageVote() {
    return hasVoted
      ? handleRemoveRoomMessageVote()
      : handleCreateRoomMessageVote();
  }

  async function handleCreateRoomMessageVote() {
    if (!roomId || !id) {
      return;
    }

    try {
      await createRoomMessageVote(roomId, id);
      setHasVoted(true);
    } catch {
      toast.error("Failed to vote on message!");
    }
  }

  async function handleRemoveRoomMessageVote() {
    if (!roomId || !id) {
      return;
    }

    try {
      await removeRoomMessageVote(roomId, id);

      setHasVoted(false);
    } catch {
      toast.error("Failed to remove vote from message!");
    }
  }

  return (
    <li
      data-disabled={disabled}
      className="ml-4 leading-relaxed text-zinc-100 data-[disabled=true]:opacity-50 data-[disabled=true]:pointer-events-none"
    >
      {text}

      <button
        type="button"
        data-up={hasVoted}
        onClick={handleToggleRoomMessageVote}
        className="mt-3 flex items-center gap-2 text-zinc-400 text-sm font-medium transition-colors hover:text-zinc-300 data-[up=true]:text-orange-400 data-[up=true]:hover:text-orange-500"
      >
        <ArrowUp className="size-4" /> Upvote ({votes})
      </button>
    </li>
  );
}
