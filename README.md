# Portfolio

A CRT terminal on the floor of an 816-desk office. Scroll and the camera crosses the room,
picks one workstation and sits down at it; the screen runs a Windows 95 desktop where every
section of the portfolio is a program. Two of them actually run rather than describe
themselves — a WebGL raymarcher and a BM25 search engine.

Live at [adithyasherwood.vercel.app](https://adithyasherwood.vercel.app).

## Running it

```sh
npm install
npm run dev
```

`npm run build` emits to `dist/`.

## How it is put together

- **Scroll position is the only state.** It drives the title card's reveal and the camera's
  descent from the same number, so opening the title and entering the room are one gesture
  with no seam. `src/lib/scrollZones.ts` is the single source for that mapping.
- **The screen is real DOM**, on a CSS3D plane inside the scene (drei's `<Html transform>`),
  so text stays sharp and drag, click and keyboard work natively. The CRT treatment is CSS,
  paired with an emissive plane in WebGL so the room is lit by the monitor.
- **816 workstations, one draw call each** for desk, partition and terminal, via
  `InstancedMesh` with the model's node matrix baked into every instance.
- **The lighting is a procedurally built environment map** — `<Lightformer>` rects standing in
  for ceiling troffers, not a downloaded `.hdr`. Swap in a file at `src/scene/Lighting.tsx`.

## Content

Everything on the site resolves to `src/data/` — profile, projects, research, resume. No figure
appears in a component literal, so the publication's numbers have exactly one place to be wrong.

## Credits

3D model: "Computer Terminal" by Chris Sweetwood,
[CC-BY-SA-4.0](http://creativecommons.org/licenses/by-sa/4.0/). Backdrop planes removed,
textures recompressed. The key plate is original work.

Built with three.js, React, Vite and 98.css.
