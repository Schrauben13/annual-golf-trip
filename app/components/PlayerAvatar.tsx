"use client";

import Image from "next/image";
import { useState } from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PlayerAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const firstName = name.split(" ")[0];

  if (imgError) {
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
        className="flex shrink-0 items-center justify-center rounded-full bg-emerald-700 font-bold text-white"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 overflow-hidden rounded-full"
    >
      <Image
        src={`/players/${firstName}.jpg`}
        alt={name}
        fill
        className="object-cover object-top"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
