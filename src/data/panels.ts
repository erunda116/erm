export type PanelModel = {
  id: string;
  label: string;
  modelPath: string;
  imagePath: string;
  heightCm: number;
  priceGrey: number;   
  priceWhite: number;
  side: 'one' | 'double';
  weightKgPerPanel: number;
  reference: string;
  topOnly?: boolean;
};

export const PANEL_MODELS: PanelModel[] = [
  {
    id: "urban40grey",
    label: "Urban 40mm",
    modelPath: "/models/panels/urban40grey.glb",
    imagePath: "/images/panels/urban40grey.jpg",
    heightCm: 50,
    priceGrey: 29,   // ← было price: 30
    priceWhite: 37,  //
    side: 'one',
    weightKgPerPanel: 75,
    reference: "ERM.F.0717",
  },
  {
    id: "rusticstone300",
    label: "Rustic Stone 300",
    modelPath: "/models/panels/RusticStone300grey.glb",
    imagePath: "/images/panels/rusticstone300.jpg",
    heightCm: 30,
    priceGrey: 21,   // ← было price: 30
    priceWhite: 29,  //
    side: 'one',
    weightKgPerPanel: 40,
    reference: "ERM.F.0208",
  },
  {
    id: "classicbrick300",
    label: "Classic Brick 300",
    modelPath: "/models/panels/ClassicBrick300.glb",
    imagePath: "/images/panels/classicBrick300.jpg",
    heightCm: 30,
    priceGrey: 21,   // ← было price: 30
    priceWhite: 29,  //
    side: 'one',
    weightKgPerPanel: 40,
    reference: "ERM.F.0665",
  },
  {
    id: "classicwood",
    label: "Classic Wood 40mm",
    modelPath: "/models/panels/ClassicWood.glb",
    imagePath: "/images/panels/classicwood.jpg",
    heightCm: 50,
    priceGrey: 29,   // ← было price: 30
    priceWhite: 37,  //
    side: 'one',
    weightKgPerPanel: 75,
    reference: "ERM.F.0526",
  },
  {
    id: "heritagestone300",
    label: "Heritage Stone 300",
    modelPath: "/models/panels/HeritageStone300.glb",
    imagePath: "/images/panels/heritage300.jpg",
    heightCm: 30,
    priceGrey: 21,   // ← было price: 30
    priceWhite: 29,  //
    side: 'one',
    weightKgPerPanel: 40,
    reference: "ERM.F.0783",
  },
  {
    id: "heritagestone500",
    label: "Heritage Stone 500",
    modelPath: "/models/panels/HeritageStone500.glb",
    imagePath: "/images/panels/heritage500.jpg",
    heightCm: 50,
    priceGrey: 25,   // ← было price: 30
    priceWhite: 33,  //
    side: 'one',
    weightKgPerPanel: 75,
    reference: "ERM.F.0703",
  },
  {
    id: "minimalist",
    label: "Minimalist 500 30mm",
    modelPath: "/models/panels/Minimalist.glb",
    imagePath: "/images/panels/minimalist.jpg",
    heightCm: 50,
    priceGrey: 25,   // ← было price: 30
    priceWhite: 33,  //
    side: 'one',
    weightKgPerPanel: 57,
    reference: "ERM.F.0901",
  },
  {
    id: "oldwood",
    label: "Old Wood 40mm",
    modelPath: "/models/panels/OldWood.glb",
    imagePath: "/images/panels/oldwood.png",
    heightCm: 50,
    priceGrey: 29,   // ← было price: 30
    priceWhite: 37,  //
    side: 'one',
    weightKgPerPanel: 75,
    reference: "ERM.F.0212",
  },
  {
    id: "riverstone",
    label: "River Stone 40mm",
    modelPath: "/models/panels/RiverStone.glb",
    imagePath: "/images/panels/riverStone.jpg",
    heightCm: 50,
    priceGrey: 29,   // ← было price: 30
    priceWhite: 37,  //
    side: 'one',
    weightKgPerPanel: 75,
    reference: "ERM.F.0167",
  },
  {
    id: "urbanDouble",
    label: "Urban Double Sided",
    modelPath: "/models/panels/urbanDouble.glb",
    imagePath: "/images/panels/urban40grey.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'double',
    weightKgPerPanel: 72,
    reference: "ERM.F.0717",
  },
  {
    id: "WoodDouble",
    label: "Wood Double Sided",
    modelPath: "/models/panels/woodDouble.glb",
    imagePath: "/images/panels/classicwood.jpg",
    heightCm: 50,
    priceGrey: 30,   // ← было price: 30
    priceWhite: 38,  //
    side: 'double',
    weightKgPerPanel: 72,
    reference: "ERM.F.0526",
  },
  {
    id: "quinta",
    label: "Quinta 40mm",
    modelPath: "/models/panels/quinta1.glb",
    imagePath: "/images/panels/quinta.jpg",
    heightCm: 50,
    priceGrey: 25,
    priceWhite: 33,
    side: 'one',
    weightKgPerPanel: 40,
    reference: "ERM.F.0727",
    topOnly: true, // ← только верхний ряд
  },
 /* {
    id: "hollyvine",
    label: "Hollyvine",
    modelPath: "/models/panels/hollyvine.glb",
    imagePath: "/images/panels/hollyvine.jpg",
    heightCm: 50,
    priceGrey: 28,
    priceWhite: 36,
    side: 'double',
    weightKgPerPanel: 85,
    reference: "HLV-50",
    topOnly: true, // ← только верхний ряд
  },*/
];

// Панели которыми можно набрать высоту одной моделью (высота кратна heightCm)
export function getPanelsForSingleModel(heightCm: number): PanelModel[] {
  return PANEL_MODELS.filter((p) => !p.topOnly && heightCm % p.heightCm === 0);
}