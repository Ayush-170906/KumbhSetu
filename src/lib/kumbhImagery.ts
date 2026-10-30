// Central manifest for the Kumbh Mela photography used across the redesign.
// Every image is a CC-licensed Wikimedia Commons photo, resized/recompressed
// for the web (see public/images/kumbh/CREDITS.md). Keeping the paths + credit
// lines in one place means a surface can drop in an image without re-deriving
// its attribution, and swapping the asset set later is a single-file change.

export interface KumbhImage {
  /** public/ path */
  src: string;
  /** short alt text */
  alt: string;
  /** Original Wikimedia Commons file page with licence and author details. */
  source: string;
  /** "<author> · <licence>" — rendered near the image where space allows */
  credit: string;
  /** approximate focal point for object-position, e.g. "50% 40%" */
  focus: string;
}

export const KUMBH_IMAGES = {
  /** Wide crowd bathing on the Godavari — the definitive Simhastha frame. */
  snan: {
    src: "/images/kumbh/simhastha-nashik.jpg",
    alt: "Pilgrims bathing on the Godavari during the Nashik Simhastha Kumbh Mela",
    source: "https://commons.wikimedia.org/wiki/File:Simhastha_Kumbh_Mela_at_Nashik_in_Maharashtra_state.jpg",
    credit: "Prashant Kharote · CC BY-SA 4.0",
    focus: "50% 42%",
  },
  /** Ghats packed along the river — good for split / side imagery. */
  ghats: {
    src: "/images/kumbh/godavari-ghats.jpg",
    alt: "Kumbh Mela crowds on the ghats of the river Godavari, Nashik",
    source: "https://commons.wikimedia.org/wiki/File:Kumbha_mela_on_ghats_of_the_river_godavari_nashik.jpg",
    credit: "Prashant Kharote · CC BY-SA 4.0",
    focus: "50% 45%",
  },
  /** Closer frame of the holy dip at Goda Ghat. */
  dip: {
    src: "/images/kumbh/goda-ghat-snan.jpg",
    alt: "Devotees taking the holy dip at Goda Ghat, Nashik, during the Kumbh Mela",
    source: "https://commons.wikimedia.org/wiki/File:Nashik_kumbha_snan.jpg",
    credit: "Prashant Kharote · CC BY 4.0",
    focus: "50% 50%",
  },
  /** Trimbakeshwar Jyotirlinga temple — the pilgrimage anchor. */
  temple: {
    src: "/images/kumbh/trimbakeshwar-temple.jpg",
    alt: "Trimbakeshwar Shiva Temple, one of the twelve Jyotirlingas, near Nashik",
    source: "https://commons.wikimedia.org/wiki/File:Trimbakeshwar_Shiva_Temple.jpg",
    credit: "Aniket.ganguly · CC BY-SA 3.0",
    focus: "50% 35%",
  },
} satisfies Record<string, KumbhImage>;

export type KumbhImageKey = keyof typeof KUMBH_IMAGES;
