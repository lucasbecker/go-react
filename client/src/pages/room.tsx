import { Suspense } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "../components/logo";
import { Messages } from "../components/messages";
import { MessageForm } from "../components/message-form";

export function Room() {
  const { roomId } = useParams();

  function handleShareRoom() {
    const url = window.location.href.toString();

    if (navigator.share !== undefined && navigator.canShare()) {
      navigator.share({ url });
      return;
    }

    navigator.clipboard.writeText(url);

    toast("The room URL was copied to your clipboard!");
  }

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

        <span className="text-sm text-zinc-500 truncate">
          Room code: <span className="text-zinc-300">{roomId}</span>
        </span>

        <button
          type="button"
          onClick={handleShareRoom}
          className="ml-auto bg-zinc-800 text-zinc-300 px-3 py-1.5 gap-1.5 flex items-center rounded-lg font-medium text-sm transition-colors hover:bg-zinc-700"
        >
          Share <Share2 className="size-4" />
        </button>
      </header>

      <hr className="w-full border-zinc-900" />

      <MessageForm />

      <Suspense
        fallback={
          <span className="leading-relaxed text-zinc-400">Loading...</span>
        }
      >
        <Messages />
      </Suspense>
    </main>
  );
}
