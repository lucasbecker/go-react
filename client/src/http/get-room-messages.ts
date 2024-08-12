export type GetRoomMessagesResponse = Array<{
  id: string;
  text: string;
  votes: number;
  answered: boolean;
}>;

export async function getRoomMessages(
  roomId: string
): Promise<GetRoomMessagesResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/rooms/${roomId}/messages`,
    {
      method: "GET",
    }
  );

  const data: Array<{
    ID: string;
    RoomID: string;
    Message: string;
    ReactionCount: number;
    Answered: boolean;
  }> = await response.json();

  return data.map((item) => ({
    id: item.ID,
    text: item.Message,
    votes: item.ReactionCount,
    answered: item.Answered,
  }));
}
