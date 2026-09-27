import Image from "next/image";

export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="KhorocBoi"
      width={size}
      height={size}
      priority
      className={`rounded-xl object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
