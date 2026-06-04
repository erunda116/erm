export type PillarStyle = "smooth" | "woodlike";

export type PillarModel = {
  id: string;
  style: PillarStyle;
  heightCm: number;
  aboveGroundCm: number;
  burialCm: number;
  modelPath: string;
  imagePath: string;
  price: number;
  weightKg: number;
};

export const PILLAR_MODELS: PillarModel[] = [
  {
    id: "smooth-220",
    style: "smooth",
    heightCm: 220,
    aboveGroundCm: 140,
    burialCm: 80,
    modelPath: "/models/posts/PillarSmooth22.glb",
    imagePath: "/images/posts/smooth22.jpg",
    price: 35,
    weightKg: 95,
  },
  {
    id: "smooth-285",
    style: "smooth",
    heightCm: 285,
    aboveGroundCm: 200,
    burialCm: 85,
    modelPath: "/models/posts/PillarSmooth28.glb",
    imagePath: "/images/posts/smooth28.jpg",
    price: 42,
    weightKg: 110,
  },
  {
    id: "smooth-330",
    style: "smooth",
    heightCm: 330,
    aboveGroundCm: 250,
    burialCm: 80,
    modelPath: "/models/posts/PillarSmooth33.glb",
    imagePath: "/images/posts/smooth33.jpg",
    price: 48,
    weightKg: 95,
  },
  {
    id: "woodlike-220",
    style: "woodlike",
    heightCm: 220,
    aboveGroundCm: 140,
    burialCm: 80,
    modelPath: "/models/posts/PillarWoodlike22.glb",
    imagePath: "/images/posts/woodlike22.jpg",
    price: 40,
    weightKg: 95,
  },
  {
    id: "woodlike-285",
    style: "woodlike",
    heightCm: 285,
    aboveGroundCm: 200,
    burialCm: 85,
    modelPath: "/models/posts/PillarWoodlike28.glb",
    imagePath: "/images/posts/woodlike28.jpg",
    price: 47,
    weightKg: 95,
  },
  {
    id: "woodlike-330",
    style: "woodlike",
    heightCm: 330,
    aboveGroundCm: 250,
    burialCm: 80,
    modelPath: "/models/posts/PillarWoodlike33.glb",
    imagePath: "/images/posts/woodlike33.jpg",
    price: 55,
    weightKg: 95,
  },
];

export const PILLAR_STYLES: { id: PillarStyle; label: string }[] = [
  { id: "smooth", label: "Smooth" },
  { id: "woodlike", label: "Woodlike" },
];

export function getCompatiblePillar(style: PillarStyle, fenceHeightCm: number): PillarModel {
  const candidates = PILLAR_MODELS
    .filter((p) => p.style === style && p.aboveGroundCm >= fenceHeightCm)
    .sort((a, b) => a.heightCm - b.heightCm);
  return candidates[0] ?? PILLAR_MODELS.filter((p) => p.style === style).at(-1)!;
}