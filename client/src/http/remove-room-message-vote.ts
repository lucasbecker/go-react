export async function removeRoomMessageVote(roomId: string, messageId: string) {
  await fetch(
    `${
      import.meta.env.VITE_API_URL
    }/rooms/${roomId}/messages/${messageId}/react`,
    {
      method: "DELETE",
    }
  );
}
