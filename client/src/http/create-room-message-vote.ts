export async function createRoomMessageVote(roomId: string, messageId: string) {
  await fetch(
    `${
      import.meta.env.VITE_API_URL
    }/rooms/${roomId}/messages/${messageId}/react`,
    {
      method: "PATCH",
    }
  );
}
