import Script from "next/script";
import { GuestTopupForm } from "@/components/guest-topup-form";
import { env } from "@/lib/config/env";

export default function GuestTopupPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-3xl items-center px-4 py-10">
      <div className="w-full rounded-[2rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-[1px] shadow-2xl">
        <div className="rounded-[calc(2rem-1px)] bg-white/95 p-4 sm:p-6">
          <GuestTopupForm
            clientKey={env.AUTHORIZE_NET_CLIENT_KEY}
            apiLoginId={env.AUTHORIZE_NET_API_LOGIN_ID}
          />
        </div>
      </div>

      <Script src="https://js.authorize.net/v1/Accept.js" strategy="afterInteractive" />
    </main>
  );
}
