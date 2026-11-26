import { getImageProps, type ImageLoader } from "next/image";
import manifest from "./image-manifest.json";

export type ImageName = keyof typeof manifest;

type PictureProps = {
  name: ImageName;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** CSS mask-image applied to the <picture>, for layered compositions. */
  mask?: string;
};

function loaderFor(name: ImageName, format: "avif" | "webp"): ImageLoader {
  const { widths } = manifest[name];
  return ({ width }) => {
    const best = widths.find((w) => w >= width) ?? widths[widths.length - 1];
    return `/images/${name}-${best}.${format}`;
  };
}

/**
 * Serves the pre-built AVIF/WebP variants from scripts/build-images.mjs through
 * next/image's srcset logic, with AVIF preferred via <picture>.
 */
export function Picture({ name, alt, sizes, priority, className, imgClassName, mask }: PictureProps) {
  const { width, height, blurDataURL } = manifest[name];
  const common = { alt, width, height, sizes, priority, src: name, placeholder: "blur" as const, blurDataURL };

  const { props: avif } = getImageProps({ ...common, loader: loaderFor(name, "avif") });
  const { props: webp } = getImageProps({ ...common, loader: loaderFor(name, "webp") });

  return (
    <picture
      className={className}
      style={mask && mask !== "none" ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      <source type="image/avif" srcSet={avif.srcSet} sizes={sizes} />
      <img {...webp} alt={alt} className={imgClassName} />
    </picture>
  );
}
