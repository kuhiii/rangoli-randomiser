# Rangoli Generator

A Coolors-style randomiser for vector rangolis. Press **space** to generate. Lock what you like and everything else rerolls around it.

## Run it

Open `index.html` in a browser. Share links and PNG export work more reliably through a local server:

```bash
python3 serve.py   # like http.server, but never cached, so reloads always get the latest code
```

Then visit http://localhost:5317.

## How it works

| You want to… | Do this |
|---|---|
| Generate a new rangoli | `space` (or the Generate button) |
| Lock / reroll / recolour an element | Hover it (tap on mobile) → floating toolbar · `L` locks the hovered element |
| Delete an element | Drag it onto the bin, or hover + `Delete` |
| Lock / change a colour | Hover a swatch → lock / reroll · click the hex code to pick a colour |
| Change the floor / toran | **Decorate** tab on the right edge (on mobile: the Decorate tab in the bottom sheet) → yellow Athangudi, coastal blue, red oxide or Kota stone · toggle the neem & marigold toran |
| Add festive stickers | Decorate → drag a sweet, candle, cracker or decoration onto the floor (or tap it) |
| Add a colour | **+** under the palette (5 to 7 colours) |
| Edit a sticker | Hover it (tap on mobile) → smaller · bigger · rotate · flip · duplicate · delete · drag the corner dot to resize · drag to move or onto the bin |
| Undo / redo | `⌘Z` / `⇧⌘Z` |
| Browse past designs | Drag the gallery drawer up · hover a design → **Reuse** or **PNG** |
| Share | The page URL always encodes the exact design, floor and stickers |
| Export | **Export** → whole picture (floor, toran, stickers and rangoli as PNG), rangoli only (transparent PNG) or SVG |

**Layouts.** Each press of space picks one:

| Layout | Share | What it is |
|---|---|---|
| Mandala | 40% | Concentric rings around a centre. Some rings repeat a motif: lotuses, diyas, footprints… |
| Centrepiece | 20% | One big figure (peacock, swan, lotus, kalash, Om…) on a powder disc, framed by border rings |
| Square kolam | 15% | Square or diamond frames, a kolam, pookalam or swastika centre, motifs in the corners |
| Mirrored pair | 10% | Two peacocks, swans or fish facing a kalash, diya or lotus |
| Asymmetric | 15% | Off-centre cluster, flowing vine, or one figure trailing swirls and dot trails |

About half of all designs include a figure.

**Motifs** live in `js/motifs.js` and can be reviewed on `motifs.html`. Each is drawn from photos of real rangolis or from reference drawings: peacocks, swan, lotus, bud, flower, butterfly, sun, diya, kalash, paisley, swastika, mango leaves, Sanskar Bharati flower, dot kolam, pookalam, dot-grid steps, Lakshmi footprints, hand, Om, conch and fish.

**Look.** Each design is either white-outline or colour-band, never a mix. Closed shapes are always filled; only open line work, such as kolam loops, is drawn as bare lines.

**Colours.** Figures take the palette colours closest to their natural ones: peacocks go blue and green, marigolds orange. Every element refers to palette slots, so locking a colour keeps it everywhere it is used.

**Locks.** If anything is locked, space keeps the same layout and only regenerates the unlocked parts. Rerolling an element keeps its motif and gives a new variant: new colours, count and details.

**The look** copies real powder rangoli:
- grainy coloured powder with rough, hand-poured edges
- white rice-flour outlines and dots
- solid ground bands under motifs, so the design reads as filled in
- motifs seen from above: layered lotus, marigolds, clay diyas with lit flames, peacock feathers, paisleys, pookalam segments and spirals, flower vines and loose petals

**The setting** is part of each design: the floor it's drawn on (simple Athangudi tiles in yellow or coastal blue, polished red oxide or Kota stone), a toran of neem sprigs and marigold strings hung across the top, and any stickers you place. Pressing space changes only the rangoli; the setting stays.

The gallery and the design you had open are saved in your browser's localStorage, so a reload brings you back to where you were.

The gallery sheet uses [GSAP](https://gsap.com) (Draggable and Flip, loaded from a CDN) for dragging and the strip-to-grid animation.

## Files

- `js/motifs.js`: the figurative motif drawings (also shown on `motifs.html`)
- `js/render.js`: the vector renderer (rings, motif rings, figures, vines, symmetry, stone texture)
- `js/generator.js`: layouts, random generation, lock-aware rerolls, state validation
- `js/scene.js`: floors, the toran and the sticker art
- `js/palette.js`: harmonised palettes with locks
- `js/app.js`: UI, drag and drop, history, gallery, share, export
- `js/store.js`: localStorage and URL encoding
