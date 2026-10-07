# Pip assets and interaction identity

Implementation update, 7 October 2026: the application reuses the existing idle/capture artwork, frame registration and capture timings in its own React canvas component. It has a still idle pose, one animation after a committed save, quiet/reduced-motion stills and no sound. The packaging/tray icon is cropped from the supplied idle frame. Original atlases, metadata, prompts and preview/player files remain unchanged; no new mascot artwork was generated.

The selected mascot is Pip: a plump apricot bird with a cream belly, tiny golden beak and feet, two tuft feathers and warm dark eyes. The user chose this character and the bird theme. Preserve its proportions and personality when the software project begins; another naming or visual-design round is not a prerequisite.

## Asset inventory

| Location | Contents and intended use |
| --- | --- |
| [Original concepts](assets/reference/original-concepts.png) | Initial sheet containing Nori, Pip and Tuck. Pip is the center character; the other concepts are not product mascots. |
| [Selected pose sheet](assets/reference/pip-sprites.png) | Six Pip poses in a 3 by 2 grid, 1536 by 1024 PNG, with transparency. Reference art, not the current animation source. |
| [Small pose sheet](assets/reference/pip-sprites.webp) | 768 by 512 WebP version of the same reference. |
| [Reference prompt](assets/reference/pip-sprites.prompt.txt) | Prompt used with built-in image generation for the pose sheet. |
| [Animation directory](assets/animation/) | Five full PNG sprite atlases and five WebP runtime copies. |
| [Animation prompts](assets/animation/prompts.txt) | Built-in image-generation prompts for all five actions. |
| [Runtime metadata](assets/animation/assets.json) | Embedded WebP sources, foot anchors and current registration transforms. |
| [Registration evidence](assets/animation/registration.json) | Numerical fitting error before/after the current stabilization pass. |
| [Standalone preview](preview/pip.html) | Playable motion, frame scrubber, reduced-motion behavior, mute and three synthesized chirps. |
| [Editable preview](preview/template.html) | Canvas player and Web Audio sound definitions; artwork is injected by the build script. |

Each animation PNG is 1448 by 1086 pixels: four columns by three rows, twelve square 362-pixel frames in row-major order. Each WebP is 768 by 576 pixels, with 192-pixel cells. Use the actual dimensions, not the 2048 by 1536 size requested in the generation prompts. The original PNGs retain alpha; apparent colors in transparent pixels are not a background to preserve.

## Motion states

| File stem | Action | Current playback |
| --- | --- | --- |
| idle | Blink and small eye movements | Calm loop with a long initial hold |
| capture | Lift and tuck a blue note under a wing | Play once, hold final pose |
| think | Raise wing and tap chin | Loop with pauses |
| celebrate | Articulated two-wing flutter | Play once, settle |
| rest | Small covered yawn and closed eyes | Play once, hold resting pose |

There are sixty generated drawings, not sixty hand-authored frames. The current player performs registration to compensate for small scale, position and angle differences in those drawings. This is corrective alignment, not the earlier whole-character bend-and-bounce effect.

The latest measured fitting error over the selected stable regions decreased by about 75% relative to the earlier foot-only registration. That is an internal image-alignment measure, not a percentage claim about perceived smoothness. The user still noticed residual variation; the artwork remains a prototype rather than final production animation.

## Animation acceptance for production

Pip should look planted in one place while acting. Preserve a stable camera angle, body silhouette and foot location. Wings, eyelids and beak articulate independently. Do not reintroduce arbitrary whole-image rotation, squash or jitter to imply activity.

For the next dedicated art pass, use a fixed body rig with separate articulated parts, or consistently registered frames from one source rig. Evaluate registration at the small size used in the real companion, not only on a large sprite sheet. Keep the current art until an improved version demonstrably preserves Pip's identity and removes the unwanted drift.

Use semantic events: capture confirmation only after a local save, thinking only while useful work is in progress, a modest completion gesture after explicit task completion, and rest during quiet/focus periods. Limit repeats and return to stillness. Reduced motion uses an appropriate still frame; disabling animation must not hide processing/error information.

## Chirps

The preview includes a short rising capture chirp, a two-note check-in and a three-note completion trill. They are synthesized with Web Audio; there are no WAV/MP3 recordings to move or license separately. Their source, timing, frequencies and gain envelopes are embedded in `preview/template.html`.

Sound starts muted. Production settings should add master volume and per-event enablement, respect quiet hours/focus mode and Windows notification choices, and prevent repeated sounds during queue retries. Do not chirp on every background classification. The preview's sound choices are a draft of this behavior, not a complete notification scheduler.

## UI appearance

Use apricot, warm cream and soft charcoal, with normal light/dark contrast and native keyboard focus. Current preview color pairs are in the root CSS custom properties of the template. Treat them as a starting palette, not a complete design system.

Pip belongs in a small companion surface and selected empty/confirmation states. It should not dominate the task workspace, block content or continuously ask for attention. Keep controls named by their purpose: Tasks, Projects, Search, Graph and Settings.

App icon sizes, tray variants, installer artwork and an accessible high-contrast asset set have not been authored. Plan these during packaging. Do not ship the multi-character concept sheet as the application icon.

## Provenance and publication

All included mascot artwork was generated for this project with the built-in image-generation tool using the chosen Pip concept as the reference. WebP copies, frame registration and the player are derived prototype assets. The current handoff makes no claim that the artwork is hand drawn, trademark-cleared or already assigned an open-source license.

The standalone export includes a generated browser wrapper from the visualization tooling used for the prototype. It is development/demo material. The application should reuse the mascot and player behavior through its own UI, rather than copying that entire preview wrapper into production.

Before public release, select the project's code/content licensing, keep provenance and dependency notices, and review the name and any additional third-party assets. This is a release task, not a reason to delay local development.
