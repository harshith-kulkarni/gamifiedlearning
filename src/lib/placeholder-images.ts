export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// Safe fallback data in case JSON import fails
const defaultImages: ImagePlaceholder[] = [
  {
    id: "user-avatar",
    description: "User avatar for header dropdown",
    imageUrl: "https://picsum.photos/seed/user-avatar/32/32",
    imageHint: "person"
  }
];

let placeholderImages: ImagePlaceholder[] = defaultImages;

try {
  const data = require('./placeholder-images.json');
  placeholderImages = data.placeholderImages || defaultImages;
} catch (error) {
  console.warn('Failed to load placeholder images, using defaults:', error);
  placeholderImages = defaultImages;
}

export const PlaceHolderImages: ImagePlaceholder[] = placeholderImages;
