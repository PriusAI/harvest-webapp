"use client";

import { useUser } from "@/hooks/useUser";
import { SelectDatabases } from "@/components/SelectDatabases";
import { NotionGuide } from "@/components/NotionGuide";

export default function Page() {
    const [user] = useUser();

    if (!user) {
        return <SelectDatabases.Skeleton />;
    }

    if (!user.access_token) {
        return <NotionGuide state={user.state} />;
    }

    return <NotionGuide state={user.state} rebind />;
}

export const runtime = "edge";