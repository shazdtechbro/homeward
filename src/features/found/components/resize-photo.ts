/**
 * Phones take 4–12 MB photos. Shrink to 1280px JPEG in the browser before
 * upload: faster on campus data, cheaper to store, and plenty for matching.
 */
export async function resizePhoto(file: File, maxSide = 1280, quality = 0.84): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not read that photo."))), "image/jpeg", quality),
  );
}
