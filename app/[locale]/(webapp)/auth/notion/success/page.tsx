import { cookies } from "next/headers";
import { notifyException } from "@/lib/notify";
import { SelectDatabases } from "@/components/SelectDatabases";
import { LogIn } from "@/components/LogIn";
import { auth } from "@/auth";

export const runtime = "edge";

export default async function Page() {
  try {
    const session = await auth();

    if (session?.user) {
      return <SelectDatabases.WeChat />;
    }

    // TODO: extension and 个微，后续个微停服后，extension auth 合并到企业微信
    const cookieStore = cookies();
    const token = cookieStore.get("access_token");
    const wxId = cookieStore.get("wx_id");

    const data: any = { t: Date.now() };

    // TODO: 老版本的功能兼容，后续个微停服后删除
    if (wxId?.value) {
      data.wxId = wxId.value;
    }

    const state = Buffer.from(JSON.stringify(data)).toString("base64");

    if (!token?.value) {
      return <LogIn state={state} isAuth />;
    }

    // TODO: is extension, can not need select databases
    return <SelectDatabases isAuth state={state} access_token={token.value} />;
  } catch (error: any) {
    await notifyException(error).catch();
    return (
      <div className="max-w-md mx-auto w-full space-y-4 text-center">
        Error: {error.message}
      </div>
    ); // Display the error message to the user
  }
}
