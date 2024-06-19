"use client";

import {
  AddForm,
  Login,
  SavePage,
  SelectForm,
  SaveDone,
} from "@/components/Harvest";
import React, { useState, useCallback, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteType } from "@/components/Harvest";
import { getUserId, updateHeight } from "@/components/Harvest/utils";

import PubSub from "@/lib/PubSub";
import { useMount } from "ahooks";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development'

const SaveToNotion = () => {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>({});
  const [route, setRoute] = useState<RouteType | null>(null);

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
  useMount(() => {
    setTimeout(() => {
      getUserId()
        .then((userId) => {
          setUserId(userId);
          switchRoute("firstSelectForm");
        })
        .catch(() => {
          switchRoute("login");
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);
  });

  const closeModal = useCallback(() => {
    window.parent.postMessage({ s: "notion-harvest", type: "closeModal" }, "*");
    setRoute(null);
  }, []);

  const switchRoute = useCallback((route: RouteType, data?: any) => {
    setRoute(route);
    switch (route) {
      case "addForm":
        updateHeight(560);
        break;
      case "login":
        updateHeight(240);
        break;
      case "savePage":
        updateHeight(480);
        break;
      case "selectForm":
        updateHeight(320);
        break;

      case "saveDone":
        updateHeight(240);
        if (data?.pageId) setPageData(data);
        break;
      default:
        break;
    }
  }, []);

  const renderSkeleton = () => (
    <div className="w-full p-3 flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );

  const render = () => {
    if (loading) return renderSkeleton();
    const commProps = { userId, switchRoute, closeModal };

    switch (route) {
      case "addForm":
        return <AddForm {...commProps} />;
      case "login":
        return <Login {...commProps} />;
      case "savePage":
        return <SavePage {...commProps} />;
      case "selectForm":
        return <SelectForm {...commProps} />;
      case "firstSelectForm":
        return <SelectForm {...commProps} first />;
      case "saveDone":
        return <SaveDone {...commProps} {...pageData} />;
      default:
        return renderSkeleton();
    }
  };
  return (
    <div className="flex flex-col w-full h-full rounded-xl" data-route={route}>
      <div className="flex items-center justify-between p-2 rounded-t-xl">
        <div className="pl-2 font-medium leading-none">Notion Harvest</div>
        <Button size="icon" variant="ghost" onClick={closeModal}>
          <X />
        </Button>
      </div>
      {render()}
    </div>
  );
};
export default SaveToNotion;
