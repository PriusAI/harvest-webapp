"use client";

import { useRef, PropsWithChildren, useEffect } from "react";
import { useSize } from "ahooks";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { closeModal, updateHeight } from "./utility";
import PubSub from "@/lib/PubSub";

export default function Layout({ children }: PropsWithChildren) {
  const ref = useRef(null);
  const size = useSize(ref);

  useEffect(() => {
    if (size?.height) {
      updateHeight(size.height);
    }
  }, [size?.height]);

  useEffect(() => {
    function onmessage(event: MessageEvent) {
      if (event.data?.s !== "notion-harvest") return;
      const { type, value } = event.data;
      switch (type) {
        case "fetchData":
          PubSub.pub("fetchData", value);
          break;
        case "storage":
          PubSub.pub("storageFetch", value);
          break;
        case "getWebContent":
          console.log("getWebContent", value);

          PubSub.pub("getWebContent", value);
          break;
        default:
          break;
      }
    }

    window.addEventListener("message", onmessage);
    return () => {
      window.removeEventListener("message", onmessage);
    };
  }, []);
  return (
    <div ref={ref} className="flex flex-col w-full h-full rounded-xl pb-2">
      <div className="flex items-center justify-between p-2 rounded-t-xl">
        <div className="pl-2 font-medium leading-none">Notion Harvest</div>
        <Button size="icon" variant="ghost" onClick={closeModal}>
          <XIcon />
        </Button>
      </div>
      {children}
    </div>
  );
}
