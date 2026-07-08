import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PostImageGridProps {
  images: string[];
}

const PostImageGrid = ({ images }: PostImageGridProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const displayImages = images.slice(0, 4);
  const extraCount = images.length - 4;

  return (
    <>
      <div className={`px-4 pb-2 grid gap-1 ${
        images.length === 1 ? "grid-cols-1" :
        images.length === 2 ? "grid-cols-2" :
        images.length === 3 ? "grid-cols-2" :
        "grid-cols-2"
      }`}>
        {displayImages.map((url, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className={`relative overflow-hidden rounded-xl ${
              images.length === 1 ? "aspect-[16/10]" :
              images.length === 3 && i === 0 ? "row-span-2 aspect-[9/16]" :
              "aspect-square"
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            {i === 3 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{extraCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 text-white/80 hover:text-white p-2"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
                className="absolute right-4 text-white/80 hover:text-white p-2"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          <img
            src={images[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
};

export default PostImageGrid;
