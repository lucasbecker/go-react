import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GetRoomMessagesResponse } from "../http/get-room-messages";

type WebHookMessage =
  | { kind: "message_created"; value: { id: string; message: string } }
  | { kind: "message_answered"; value: { id: string } }
  | {
      kind: "message_reaction_increased";
      value: {
        id: string;
        count: number;
      };
    }
  | {
      kind: "message_reaction_decreased";
      value: {
        id: string;
        count: number;
      };
    };

export function useMessagesWebSockets(roomId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/subscribe/${roomId}`);

    ws.onopen = () => {
      console.log("WebSocket connected!");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected!");
    };

    ws.onmessage = (event) => {
      const data: WebHookMessage = JSON.parse(event.data);

      console.log(data);

      switch (data.kind) {
        case "message_created":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (messages) => [
              ...(messages ?? []),
              {
                id: data.value.id,
                text: data.value.message,
                votes: 0,
                answered: false,
              },
            ]
          );
          break;

        case "message_answered":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (messages) => {
              if (!messages) return [];

              return messages.map((message) => {
                if (message.id === data.value.id) {
                  return {
                    ...message,
                    answered: true,
                  };
                }

                return message;
              });
            }
          );
          break;

        case "message_reaction_increased":
        case "message_reaction_decreased":
          queryClient.setQueryData<GetRoomMessagesResponse>(
            ["messages", roomId],
            (messages) => {
              if (!messages) return [];

              return messages.map((message) => {
                if (message.id === data.value.id) {
                  return {
                    ...message,
                    votes: data.value.count,
                  };
                }

                return message;
              });
            }
          );
          break;

        default:
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId, queryClient]);
}
