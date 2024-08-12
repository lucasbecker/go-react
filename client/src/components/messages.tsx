import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { useMessagesWebSockets } from "../hooks/use-messages-web-socket";
import { getRoomMessages } from "../http/get-room-messages";
import { Message } from "./message";

export function Messages() {
  const { roomId } = useParams();

  if (!roomId) {
    throw new Error("Messages component must be used within room page");
  }

  const { data } = useSuspenseQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getRoomMessages(roomId),
    retry: false,
  });

  useMessagesWebSockets(roomId);

  const sortedMessages = data.sort((a, b) => b.votes - a.votes);

  if (!sortedMessages || !sortedMessages.length) {
    return (
      <span className="leading-relaxed text-zinc-400">No questions yet.</span>
    );
  }

  return (
    <ol className="list-decimal px-3 space-y-8">
      {sortedMessages?.map((message) => (
        <Message
          id={message.id}
          key={message.id}
          text={message.text}
          votes={message.votes}
          disabled={message.answered}
        />
      ))}
    </ol>
  );
}
