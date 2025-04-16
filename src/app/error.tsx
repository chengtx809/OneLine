"use client";

import ServerErrorHandler from "@/components/ServerErrorHandler";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <ServerErrorHandler error={error} reset={reset} />
    </div>
  );
}
