"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn, signOut } from "next-auth/react";
import { LoaderCircle, LogOutIcon, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { CircleUserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCountDown, useRequest } from "ahooks";
import { useState } from "react";
import { useUserMenu } from "@/hooks/useUserMenu";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

export function SignInButton() {
  const router = useRouter();
  const [user, isLoading] = useUser();
  const t = useTranslations("UserMenu");

  const [userMenuItems] = useUserMenu();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted animate-pulse"></span>
    );
  }

  if (user) {
    const avatar =
      user.notion?.avatar ||
      user.weixin?.avatar ||
      "/images/avatar/default.png";
    const username =
      user.notion?.name || user.weixin?.name || user.email || user.name || "-";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
            <span className="sr-only">{username}</span>
            <Avatar>
              <AvatarImage src={avatar} />
              <AvatarFallback>{username.slice(-4)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {userMenuItems.map((item) => (
            <DropdownMenuItem key={item.key} asChild>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            <span>{t("LogOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full cursor-pointer hover:bg-muted">
          <CircleUserRound size={40} />
        </span>
      </DialogTrigger>
      <DialogContent className="flex p-0 w-auto flex-col overflow-hidden shadow-xl md:min-h-[30rem] md:min-w-[40rem] md:max-w-3xl md:flex-row md:rounded-lg">
        <DialogHeader>
          <VisuallyHidden asChild>
            <DialogTitle>Sign in</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <DialogDescription>微信扫码登录注册</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <SignInContent
          onLogin={() => {
            setIsOpen(false);
            router.push("/user/accounts");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SignInContentProps {
  onLogin?: () => void;
}
export function SignInContent({ onLogin }: SignInContentProps) {
  const [targetDate, setTargetDate] = useState<number>();
  const [countdown] = useCountDown({ targetDate, onEnd: () => cancel() });
  const {
    loading,
    data: ticket,
    refresh,
  } = useRequest(
    async () => {
      setTargetDate(undefined);
      return fetch("/api/mp/get-qrcode")
        .then((res) => res.json())
        .then((data: any) => data.ticket);
    },
    {
      onSuccess: () => {
        setTargetDate(Date.now() + 59 * 1000);
        run();
      },
    }
  );
  const { run, cancel } = useRequest(
    async () => {
      if (!ticket) return;
      const response = await fetch(`/api/mp/get-scan-result?ticket=${ticket}`);
      if (response.status !== 200) {
        throw new Error("Failed to get scan result");
      }
      const data: any = await response.json();
      if (data.ok) {
        console.log("Scan result", data);
        if (!data.data.unionid) {
          console.error("Invalid scan result", data);
          return;
        }
        await signIn("wechat", {
          redirect: false,
          wx_id: data.data.unionid,
        });
        cancel();
        onLogin?.();
      }
    },
    {
      manual: true,
      pollingInterval: 1200,
      pollingErrorRetryCount: 3,
    }
  );
  return (
    <>
      <div className="hidden md:flex flex-1 flexn flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-12"></div>
      <div className="flex flex-1 flex-col gap-3 items-center justify-center bg-gray-50 p-4 md:px-10 md:py-8">
        <div>
          <div>微信扫码登录注册</div>
        </div>
        <div className="text-sm text-muted-foreground text-nowrap">
          微信扫一扫关注公众号，极速注册登录
        </div>
        <div className="border rounded-lg relative flex flex-col justify-center items-center w-40 h-40">
          {!!ticket && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`}
              alt=""
              className="w-40 h-40 rounded-lg"
            />
          )}
          {countdown === 0 && targetDate && (
            <div
              className="rounded-lg flex flex-col justify-center items-center gap-2 absolute inset-0 cursor-pointer text-white bg-black/70"
              onClick={refresh}
            >
              <RotateCcw size={32} />
              <div>二维码已失效</div>
              <div>请点击刷新</div>
            </div>
          )}
          {(!ticket || loading) && (
            <div className="rounded-lg absolute inset-0 flex items-center justify-center text-white bg-black/60">
              <LoaderCircle size={36} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
