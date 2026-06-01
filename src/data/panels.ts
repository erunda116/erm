export type PanelModel = {
  id: string;
  label: string;
  modelPath: string;
  imagePath: string;
  heightCm: number;
  price: number;
};

export const PANEL_MODELS: PanelModel[] = [
  {
    id: "urban40grey",
    label: "Urban 40 Grey",
    modelPath: "/models/panels/urban40grey.glb",
    imagePath: "/images/panels/urban40grey.jpg",
    heightCm: 50,
    price: 30,
  },
  {
    id: "heritagestone500",
    label: "Heritage Stone 500",
    modelPath: "/models/panels/HeritageStone50040.glb",
    imagePath: "/images/panels/heritagestone500.jpg",
    heightCm: 50,
    price: 35,
  },
  {
    id: "rusticstone300",
    label: "Rustic Stone 300",
    modelPath: "/models/panels/RusticStone300grey.glb",
    imagePath: "/images/panels/rusticstone300.jpg",
    heightCm: 30,
    price: 25,
  },
];

// Панели которыми можно набрать высоту одной моделью (высота кратна heightCm)
export function getPanelsForSingleModel(heightCm: number): PanelModel[] {
  return PANEL_MODELS.filter((p) => heightCm % p.heightCm === 0);
}