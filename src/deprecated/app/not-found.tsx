"use client";

import Link from "next/link";
import useBoundStore from "@/store/useBoundStore";

export default function NotFound() {
  const session = useBoundStore((state) => state.ui.session);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <img
          src="/logo.png"
          alt="ChatScript"
          width={150}
          height={150}
          className="mx-auto mb-8"
        />
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href={session ? "/conversations" : "/login"}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Back
        </Link>
      </div>
    </div>
  );
}
