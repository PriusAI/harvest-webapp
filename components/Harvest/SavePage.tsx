import React from "react";
import { v4 as uuid } from "uuid";
import { useRequest } from "ahooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ReloadIcon,
  PaperPlaneIcon,
  ChevronLeftIcon,
} from "@radix-ui/react-icons";
import { BaseProps } from "./types";
import {
  getCollectionId,
  getCollections,
  getWebContent,
  loadPageChunk,
  submitTransaction,
} from "./utils";
import { html2blocks } from "@/lib/html2blocks";

export const SavePage = ({ switchRoute }: BaseProps) => {
  const { loading, data: collection } = useRequest(async () => {
    const collections = await getCollections();
    const collectionId = await getCollectionId();

    const c = collections?.find((c) => c.id === collectionId);
    if (!c) return null;
    return loadPageChunk(collectionId!, c.user_id).then((res) => {
      const k = Object.keys(res.recordMap.collection)[0];
      const collection = res.recordMap.collection[k]?.value;
      if (collection) collection.user_id = c!.user_id;
      return collection;
    });
  });
  const req = useRequest(getWebContent);
  const saveReq = useRequest(
    async () => {
      if (!req.data?.content) return;
      const pageId = uuid();
      const time = Date.now();
      const userId = collection.user_id;
      const spaceId = collection.space_id;
      const blocks = await html2blocks(req.data);
      if (!blocks.length) {
        // TODO: 提示错误
        return "";
      }
      const schemaKeys = Object.keys(collection.schema || {});
      const urlKey = schemaKeys.filter((key) => {
        const v = collection.schema[key];
        if (v.type === "url" && ["link", "url"].includes(v.name.toLowerCase()))
          return key;
      })[0];

      const pageOp = {
        id: pageId,
        table: "block",
        path: [],
        command: "update",
        args: {
          type: "page",
          id: pageId,
          space_id: spaceId,
          parent_id: collection.id,
          parent_table: "collection",
          alive: true,
          version: 1,
          created_time: time,
          last_edited_time: time,
          created_by_table: "notion_user",
          created_by_id: userId,
          last_edited_by_table: "notion_user",
          last_edited_by_id: userId,
          properties: {
            title: [[req.data.title]],
          } as any,
          content: [],
        } as any,
      };

      if (urlKey) {
        pageOp.args.properties[urlKey] = [[req.data.url]];
      } else {
        let newKey = "NuRl";
        if (schemaKeys.includes(newKey)) {
          newKey = "uRl2";
          if (schemaKeys.includes(newKey)) {
            newKey = "";
          }
        }
        if (newKey) {
          await submitTransaction(userId, [
            {
              pointer: {
                id: collection.id,
                table: "collection",
                spaceId: spaceId,
              },
              path: ["schema"],
              command: "update",
              args: {
                [newKey]: {
                  name: "URL",
                  type: "url",
                },
              },
            },
          ]);
          pageOp.args.properties[newKey] = [[req.data.url]];
        }
      }

      await submitTransaction(userId, [pageOp]);

      const chunkSize = 480; // 每个块的大小
      const numChunks = Math.ceil(blocks.length / chunkSize); // 总块数

      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize; // 当前块的起始索引
        let end = start + chunkSize; // 当前块的结束索引
        if (end > blocks.length) {
          end = blocks.length; // 最后一块的结束索引
        }
        const chunk = blocks.slice(start, end); // 获取当前块的切片

        const operations = chunk.map((block) => {
          block.args = {
            ...block.args,
            space_id: spaceId,
            parent_id: pageId,
            parent_table: "block",
            created_by_id: userId,
            last_edited_by_id: userId,
          };
          return block;
        });
        await submitTransaction(userId, operations);
      }
      pageOp.args.content = blocks.map((block) => block.id);
      await submitTransaction(userId, [pageOp]);
      return pageId.replace(/-/g, "");
    },
    {
      manual: true,
      onSuccess: (ret) => {
        if (ret) {
          switchRoute("saveDone", { pageId: ret });
        }
        // TODO: show error
      },
    }
  );

  return (
    <div className="flex flex-col p-3">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={() => switchRoute("selectForm")}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="ml-2">form</span>
        </div>
        {collection?.name ? (
          <div className="pl-2 font-medium leading-none">{collection.name}</div>
        ) : (
          <Skeleton className="h-4 w-16" />
        )}
      </div>

      <div className="w-full flex-1">
        {req.loading || loading ? (
          <div className="w-full flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Input
                disabled
                type="text"
                value={req.data?.title}
                placeholder="Search Databases"
              />
            </div>
            <Button onClick={saveReq.run}>
              {saveReq.loading ? (
                <ReloadIcon className="animate-spin" />
              ) : (
                <PaperPlaneIcon />
              )}
              <span className="ml-1">Save Page</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
