"use client";

import Image from "next/image";
import { useState } from "react";

export function UserAvatar({
  name,
  src,
  small = false,
}: {
  name: string;
  src?: string | null;
  small?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <span aria-hidden="true" className={`avatar ${small ? "avatar-small" : ""}`}>
      {src && src !== failedSrc ? (
        <Image src={src} alt="" width={small ? 24 : 68} height={small ? 24 : 68}
          unoptimized onError={() => setFailedSrc(src)} />
      ) : name.trim().slice(0, 2).toUpperCase()}
    </span>
  );
}
