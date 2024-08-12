type CreateRoomMessageRequest = {
  message: string;
};

export async function createRoomMessage(
  roomId: string,
  { message }: CreateRoomMessageRequest
) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/rooms/${roomId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );

  const data = await response.json();

  return { messageId: data.id };
}
