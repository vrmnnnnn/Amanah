import { useState, useEffect, useCallback } from "react";

export interface Category {
  key: string;
  label: string;
  icon: string;
  type: "masuk" | "keluar" | "both";
  builtin: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { key: "gaji", label: "Gaji", icon: "stars", type: "masuk", builtin: true },
  { key: "bisnis", label: "Bisnis", icon: "storefront", type: "masuk", builtin: true },
  { key: "investasi", label: "Investasi", icon: "finance", type: "masuk", builtin: true },
  { key: "makan", label: "Makan", icon: "restaurant", type: "keluar", builtin: true },
  { key: "transport", label: "Transport", icon: "directions_car", type: "keluar", builtin: true },
  { key: "belanja", label: "Belanja", icon: "shopping_bag", type: "keluar", builtin: true },
  { key: "tagihan", label: "Tagihan", icon: "bolt", type: "keluar", builtin: true },
  { key: "lainnya", label: "Lainnya", icon: "category", type: "both", builtin: true },
];

const ICON_OPTIONS = [
  "restaurant", "directions_car", "shopping_bag", "bolt", "category",
  "stars", "storefront", "finance", "home", "school", "travel",
  "favorite", "card_giftcard", "pets", "local_hospital", "fitness_center",
  "flight", "local_cafe", "sports_esports", "videogame_asset",
  "checkroom", "devices", "celebration", "emoji_events", "spa",
];

function storageKey(familyId: string) {
  return `categories_${familyId}`;
}

export function useCategories(familyId: string | undefined) {
  const [custom, setCustom] = useState<Category[]>([]);

  useEffect(() => {
    if (!familyId) {
      setCustom([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey(familyId));
      if (stored) setCustom(JSON.parse(stored));
    } catch {
      setCustom([]);
    }
  }, [familyId]);

  const save = useCallback((cats: Category[]) => {
    if (!familyId) return;
    localStorage.setItem(storageKey(familyId), JSON.stringify(cats));
    setCustom(cats);
  }, [familyId]);

  const all = [...DEFAULT_CATEGORIES, ...custom];

  const addCategory = useCallback((cat: Omit<Category, "builtin">) => {
    const newCat: Category = { ...cat, builtin: false };
    save([...custom, newCat]);
  }, [custom, save]);

  const removeCategory = useCallback((key: string) => {
    save(custom.filter((c) => c.key !== key));
  }, [custom, save]);

  const getByType = useCallback((type: "masuk" | "keluar") => {
    return all.filter((c) => c.type === type || c.type === "both");
  }, [all]);

  const getIcon = useCallback((key: string) => {
    return all.find((c) => c.key === key)?.icon || "category";
  }, [all]);

  const getLabel = useCallback((key: string) => {
    return all.find((c) => c.key === key)?.label || key;
  }, [all]);

  return {
    all,
    custom,
    addCategory,
    removeCategory,
    getByType,
    getIcon,
    getLabel,
    ICON_OPTIONS,
  };
}
