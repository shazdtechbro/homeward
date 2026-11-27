import { cn } from "./cn";
import { imageNameOr, Picture } from "./picture";

type ItemPhotoProps = {
  imageKey: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

/** Uploaded photos stream from /api/photos (private bucket); demo items use the built assets. */
export function ItemPhoto({ imageKey, alt, sizes, className, imgClassName, priority }: ItemPhotoProps) {
  if (imageKey.startsWith("up/")) {
    return (
      <span className={cn("block", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked photo; not optimisable */}
        <img
          src={`/api/photos/${imageKey}`}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("size-full object-cover", imgClassName)}
        />
      </span>
    );
  }
  return (
    <Picture
      name={imageNameOr(imageKey, "found-backpack")}
      alt={alt}
      sizes={sizes}
      priority={priority}
      className={cn("block", className)}
      imgClassName={cn("size-full object-cover", imgClassName)}
    />
  );
}
