import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "../components/logo";
import { createRoom } from "../http/create-room";

export function CreateRoom() {
  const navigate = useNavigate();

  async function handleCreateRoom(data: FormData) {
    const theme = data.get("theme")?.toString();

    if (!theme) return;

    try {
      const { roomId } = await createRoom({ theme });

      navigate(`/rooms/${roomId}`);
    } catch {
      toast.error("Failed to create room!");
    }
  }

  return (
    <main className="h-screen flex items-center justify-center p-4">
      <div className="max-w-[28rem] flex items-center flex-col gap-6">
        <Logo />

        <p className="leading-relaxed text-zinc-300 text-center">
          Create a public room and prioritize the most important questions for
          the community.
        </p>

        <form
          action={handleCreateRoom}
          className="flex w-full items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 ring-orange-400 ring-offset-2 ring-offset-zinc-950 focus-within:ring-1"
        >
          <input
            required
            type="text"
            name="theme"
            autoComplete="off"
            placeholder="Room name"
            className="flex-1 text-sm bg-transparent mx-2 outline-none text-zinc-100 placeholder:text-zinc-500"
          />

          <button
            type="submit"
            className="bg-orange-400 text-orange-950 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm transition-colors hover:bg-orange-500"
          >
            Create room <ChevronRight className="size-4" />
          </button>
        </form>

        <span className="text-xs flex justify-center w-full relative before:absolute before:top-1/2 before:z-[-1] before before:h-px before:w-full before:bg-zinc-900">
          Or
        </span>

        <Link
          to="/rooms"
          className="bg-zinc-900 text-zinc-500 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          See all rooms <ChevronRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
