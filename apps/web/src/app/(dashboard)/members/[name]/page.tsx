import { CharacterProfileClient } from "./CharacterProfileClient";

// Cloudflare Pages only serves dynamic (non-prerendered) routes via the
// Edge Runtime, not Node.js — this is the only route in the app that
// isn't statically generated (it depends on the [name] param), so it
// needs this opt-in explicitly.
export const runtime = "edge";

export default function CharacterProfilePage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  return <CharacterProfileClient name={name} />;
}
