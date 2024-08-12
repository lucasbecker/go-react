export type GetRoomsResponse = Array<{
  id: string;
  theme: string;
}>;

export async function getRooms(): Promise<GetRoomsResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
    method: "GET",
  });

  const data: Array<{
    ID: string;
    Theme: string;
  }> = await response.json();

  return data.map((item) => ({
    id: item.ID,
    theme: item.Theme,
  }));
}
