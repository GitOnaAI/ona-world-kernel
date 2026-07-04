// Concept-image and text-to-model prompt builders. The style lines describe the
// shipped art direction (KayKit / Quaternius style low-poly, flat-shaded, muted
// medieval palette; see CREDITS.md and the quality bar in
// scripts/asset_pipeline/CLAUDE.md) so generated assets sit next to existing
// ones without looking imported.
//
// The layout constraints follow the OpenAI image guide's isolation recipe for
// 3D-reconstruction reference art: one centered object, full object in frame,
// plain background, crisp silhouette, no text or extra elements.

const STYLE_CORE =
  'stylized low-poly fantasy game asset, flat shaded, clean hand-crafted topology look, ' +
  'muted classic-MMO medieval palette, subtle hand-painted color blocks, no photorealism';

const LAYOUT_OBJECT =
  'single object, centered, full object in frame, three-quarter view, plain white opaque ' +
  'background, even diffuse studio lighting, crisp silhouette, no halos or fringing, no drop ' +
  'shadow, no extra objects, no text, no watermark, no logo';

const LAYOUT_CHARACTER =
  'single character, full body, standing T-pose with arms out horizontally, facing the camera, ' +
  'centered, full figure in frame, plain white opaque background, even diffuse studio lighting, ' +
  'crisp silhouette, no halos, no drop shadow, no extra objects, no text, no watermark';

export function conceptPrompt({ kind, description, family }) {
  if (kind === 'weapon') {
    const orient = family?.heavyEndUp
      ? 'held upright, head at the top, handle at the bottom'
      : 'held upright, blade or tip pointing up, grip at the bottom';
    return `${description}, fantasy ${family?.name ?? 'weapon'}, ${orient}, ${STYLE_CORE}, ${LAYOUT_OBJECT}`;
  }
  if (kind === 'prop') {
    return `${description}, fantasy environment prop, resting on the ground, upright, ${STYLE_CORE}, ${LAYOUT_OBJECT}`;
  }
  if (kind === 'creature') {
    // The game's humanoids are CHIBI (KayKit/Quaternius mini proportions): a big
    // rounded head on a short stubby body. Tripo defaults to realistic
    // proportions, which look wrong standing next to the player, so force chibi.
    const chibi =
      'chibi proportions, large rounded head about one third of total height, short stubby ' +
      'body and limbs, small hands and feet, cute stylized mascot like KayKit and Quaternius ' +
      'mini game characters, NOT realistic human proportions';
    return `${description}, fantasy game creature, ${chibi}, ${STYLE_CORE}, ${LAYOUT_CHARACTER}`;
  }
  throw new Error(`unknown concept kind: ${kind}`);
}

/** Prompt for the direct text-to-model path (no concept image). Tripo prompts
 *  cap at 1024 chars and should describe shape, material, style. */
export function modelPrompt({ kind, description, family }) {
  const base = conceptPrompt({ kind, description, family });
  // Model generation does not need the 2D layout constraints.
  return base.replace(`, ${LAYOUT_OBJECT}`, '').replace(`, ${LAYOUT_CHARACTER}`, '').slice(0, 1024);
}

/** Prompt for a gpt-image-2 atlas repaint (player-class skin lane). */
export function atlasEditPrompt(description) {
  return (
    `This image is a 3D character texture atlas (UV layout). Repaint it: ${description}. ` +
    'Keep every color region exactly in place with identical boundaries; change only the ' +
    'colors and painted detail inside each region. Same resolution, no text, no watermark.'
  );
}
