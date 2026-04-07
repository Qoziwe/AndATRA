import { useEffect } from "react";

import { startKeepAlive } from "@/services/keepAlive";

export const useRenderKeepAlive = () => {
  useEffect(() => startKeepAlive(), []);
};
