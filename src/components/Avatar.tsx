import { useState } from "react";

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
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold uppercase ${className}`}
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      {src && !imageError ? (
        <img
          src={src}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          alt="Avatar"
        />
      ) : (
        fallback
      )}
    </div>
  );
};

export default Avatar;
