import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRealtimeClient } from "@/services/realtime";
import { useUiStore } from "@/stores/uiStore";

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const setRealtimeStatus = useUiStore((state) => state.setRealtimeStatus);

  useEffect(() => {
    const socket = getRealtimeClient();

    socket.on("connect", () => setRealtimeStatus("live"));
    socket.on("disconnect", () => setRealtimeStatus("offline"));
    socket.on("connect_error", () => setRealtimeStatus("reconnecting"));
    socket.on("new_appeal", () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
      queryClient.invalidateQueries({ queryKey: ["appeals-map"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    });
    socket.on("appeal_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
      queryClient.invalidateQueries({ queryKey: ["appeals-map"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-trends"] });
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("new_appeal");
      socket.off("appeal_updated");
      socket.disconnect();
    };
  }, [queryClient, setRealtimeStatus]);
};
