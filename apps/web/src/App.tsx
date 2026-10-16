import { discoverFeatures } from "./bootstrap/discover-features.js";

const features = discoverFeatures();

export function App() {
  return (
    <>
      {features.map((feature) => (
        <feature.Component key={feature.id} />
      ))}
    </>
  );
}
