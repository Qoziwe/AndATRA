import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "@/constants/config";

let socket: Socket | null = null;

export const getRealtimeClient = () => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: false
    });
  }

  return socket;
};
