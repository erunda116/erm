export type PanelModel = {
  id: string;
  label: string;
  modelPath: string;
  imagePath: string;
  heightCm: number;
  priceGrey: number;   
  priceWhite: number;
  side: 'one' | 'double';
};

export const PANEL_MODELS: PanelModel[] = [
  {
    id: "urban40grey",
    label: "Urban 40 Grey",
    modelPath: "/models/panels/urban40grey.glb",
    imagePath: "/images/panels/urban40grey.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "rusticstone300",
    label: "Rustic Stone 300",
    modelPath: "/models/panels/RusticStone300grey.glb",
    imagePath: "/images/panels/rusticstone300.jpg",
    heightCm: 30,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "classicbrick300",
    label: "Classic Brick 300",
    modelPath: "/models/panels/ClassicBrick300.glb",
    imagePath: "/images/panels/classicBrick300.jpg",
    heightCm: 30,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "classicwood",
    label: "Classic Wood",
    modelPath: "/models/panels/ClassicWood.glb",
    imagePath: "/images/panels/classicwood.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "heritagestone300",
    label: "Heritage Stone 300",
    modelPath: "/models/panels/HeritageStone300.glb",
    imagePath: "/images/panels/heritage300.jpg",
    heightCm: 30,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "heritagestone500",
    label: "Heritage Stone 500",
    modelPath: "/models/panels/HeritageStone500.glb",
    imagePath: "/images/panels/heritage500.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "minimalist",
    label: "Minimalist",
    modelPath: "/models/panels/Minimalist.glb",
    imagePath: "/images/panels/minimalist.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "oldwood",
    label: "Old Wood",
    modelPath: "/models/panels/OldWood.glb",
    imagePath: "/images/panels/oldwood.png",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
  {
    id: "riverstone",
    label: "River Stone",
    modelPath: "/models/panels/RiverStone.glb",
    imagePath: "/images/panels/riverStone.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'one',
  },
];

// Панели которыми можно набрать высоту одной моделью (высота кратна heightCm)
export function getPanelsForSingleModel(heightCm: number): PanelModel[] {
  return PANEL_MODELS.filter((p) => heightCm % p.heightCm === 0);
}