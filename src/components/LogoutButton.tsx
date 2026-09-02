"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10"
      onClick={async () => {
        await fetch("/api/producer/auth", { method: "DELETE" });
        router.push("/producer/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
