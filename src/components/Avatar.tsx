import * as RadixAvatar from "@radix-ui/react-avatar";

const Avatar = ({
  src,
  fallback,
  size,
  className,
}: {
  src?: string | null;
  fallback?: string | null;
  size: number;
  className: string;
}) => {
  return (
    <RadixAvatar.Root
      className={`rounded-full flex items-center justify-center font-bold text-white uppercase ${className}`}
      style={{ width: size, height: size }}
    >
      {src && <RadixAvatar.Image src={src} className="rounded-full" />}
      {fallback && <RadixAvatar.Fallback>{fallback}</RadixAvatar.Fallback>}
    </RadixAvatar.Root>
  );
};

export default Avatar;
