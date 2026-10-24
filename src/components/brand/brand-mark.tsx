import Image from "next/image";
import Link from "next/link";

import type { BrandMarkProps } from "./types/brand";

export function BrandMark({ href = "/", subtitle = "Pollería · Parcona, Ica" }: BrandMarkProps) {
  return <Link href={href} className="inline-flex min-h-12 min-w-0 items-center gap-3 rounded-field text-brand-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-surface">
    <Image src="/images/brand/sello.svg" alt="" width={64} height={64} unoptimized className="size-12 shrink-0 sm:size-16" />
    <span className="min-w-0"><span className="block font-brand text-xl font-bold leading-7 sm:text-2xl">Fuego y Brasas</span><span className="mt-1 block text-sm leading-5">{subtitle}</span></span>
  </Link>;
}
