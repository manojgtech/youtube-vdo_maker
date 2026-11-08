export type ImagePreset = {
  id: string;
  label: string;
  url: string;
};

const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

/** Well-known, long-lived Unsplash photos. Used as a zero-upload starting point. */
export const IMAGE_PRESETS: ImagePreset[] = [
  { id: "coast", label: "Coastline", url: unsplash("photo-1507525428034-b723cf961d3e") },
  { id: "city", label: "City lights", url: unsplash("photo-1545324418-cc1a3fa10c00") },
  { id: "interior", label: "Warm interior", url: unsplash("photo-1600585154340-be6161a56a0c") },
  { id: "table", label: "Table for two", url: unsplash("photo-1414235077428-338989a2e8c0") },
  { id: "team", label: "Team at work", url: unsplash("photo-1521737604893-d14cc237f11d") },
  { id: "portrait-w", label: "Studio portrait", url: unsplash("photo-1573496359142-b8d87734a5a2") },
  { id: "portrait-m", label: "Portrait, low light", url: unsplash("photo-1507003211169-0a1dd7228f2d") },
  { id: "mountains", label: "Mountains", url: unsplash("photo-1464822759023-fed622ff2c3b") },
  { id: "coffee", label: "Coffee ritual", url: unsplash("photo-1495474472287-4d71bcdd2085") },
  { id: "night", label: "Night out", url: unsplash("photo-1516450360452-9312f5e86fc7") },
  { id: "gym", label: "Training day", url: unsplash("photo-1534438327276-14e5300c3a48") },
  { id: "car", label: "The drive", url: unsplash("photo-1503376780353-7e6692767b70") },
];

export const presetById = (id: string) =>
  IMAGE_PRESETS.find((preset) => preset.id === id);

export const presetUrl = (id: string) => presetById(id)?.url ?? null;
