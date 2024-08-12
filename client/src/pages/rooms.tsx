import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Logo } from "../components/logo";
import { getRooms } from "../http/get-rooms";

export function Rooms() {
  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getRooms(),
    retry: false,
  });

  return (
    <main className="mx-auto max-w-[40rem] flex flex-col gap-6 py-10 px-4">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="text-zinc-300 p-2 gap-1 flex items-center justify-center rounded-full transition-colors hover:bg-zinc-900"
        >
          <ChevronLeft className="size-4" />
        </Link>

        <Logo size={20} />

        <span className="text-sm text-zinc-500 truncate">All rooms</span>
      </header>

      <hr className="w-full border-zinc-900" />

      {isLoading && (
        <span className="leading-relaxed text-zinc-400">Loading...</span>
      )}

      {!isLoading && (!data || !data?.length) && (
        <span className="leading-relaxed text-zinc-400">No rooms yet.</span>
      )}

      {!isLoading &&
        data?.map(({ id, theme }) => (
          <Link
            key={id}
            to={`./${id}`}
            className="flex items-center justify-between py-3 px-5 text-zinc-300 font-medium transition-colors hover:bg-zinc-900 rounded-lg"
          >
            {theme}
            <ChevronRight className="size-4" />
          </Link>
        ))}
    </main>
  );
}
