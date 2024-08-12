import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { queryClient } from "./lib/react-query";
import { CreateRoom } from "./pages/create-room";
import { Rooms } from "./pages/rooms";
import { Room } from "./pages/room";

const router = createBrowserRouter([
  {
    path: "*",
    element: <Navigate to="/" />,
  },
  {
    path: "/",
    element: <CreateRoom />,
  },
  {
    path: "rooms",
    element: <Rooms />,
    errorElement: <Navigate to="/" />,
  },
  {
    path: "rooms/:roomId",
    element: <Room />,
    errorElement: <Navigate to="/" />,
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster invert richColors />
    </QueryClientProvider>
  );
}
