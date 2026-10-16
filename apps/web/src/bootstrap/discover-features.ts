import type { ComponentType } from "react";

export type DiscoveredFeature = {
  id: string;
  label: string;
  Component: ComponentType;
};

/**
 * Autodiscovery: each feature lives under `src/features/<name>/Feature.tsx`
 * without editing this bootstrap file.
 */
export function discoverFeatures(): DiscoveredFeature[] {
  const modules = import.meta.glob<{
    Feature: ComponentType;
    featureId?: string;
    featureLabel?: string;
  }>("../features/*/Feature.tsx", { eager: true });

  return Object.entries(modules)
    .map(([path, mod]) => {
      const folder = path.split("/").slice(-2, -1)[0] ?? "unknown";
      return {
        id: mod.featureId ?? folder,
        label: mod.featureLabel ?? mod.featureId ?? folder,
        Component: mod.Feature,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
