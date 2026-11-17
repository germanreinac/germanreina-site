/*
  All site content lives here. To add a project, copy one block and edit it.

  kind:   "studio" = games / client work, "own" = personal projects
  year:   leave "" if you'd rather not show one
  shape:  size of the piece on the gallery wall: "wide", "tall" or "square"
  tone:   colour of the placeholder until real images are added
  images: paths inside /images, first one is the piece shown on the gallery wall
          e.g. ["images/olliolli-world/01.jpg", "images/olliolli-world/02.jpg"]
  notes:  short factual lines shown in the project sheet
  link:   optional { label, url }
*/
window.SITE = {
  name: "Germán Reina",
  // The line under the name. Other lines of yours that would fit here:
  //   "Creator of the art for OlliOlli World. Artist at Supercell."   (germanreina.com)
  //   "Creative Vision and Art Direction for Video Games and Animation."   (Notion bio)
  intro: "Stay creative, stay weird.",
  links: [
    { label: "Art Discipline", url: "https://artdiscipline.com" }
    // Add Instagram, YouTube, Patreon, email here.
  ]
};

window.PROJECTS = [
  {
    slug: "clash-of-clans",
    title: "Clash of Clans",
    kind: "studio",
    year: "2024–now",
    with: "Supercell",
    role: "Characters, heroes, 3D",
    shape: "wide",
    tone: "#f2b33d",
    images: [],
    notes: ["Characters and heroes.", "3D generalist work in Blender.", "Art direction of the new Town Hall."]
  },
  {
    slug: "megalith",
    title: "Megalith",
    kind: "own",
    year: "2027",
    with: "Lizz Lunney",
    role: "Graphic novel, art",
    shape: "tall",
    tone: "#7fa7a0",
    images: [],
    notes: ["Graphic novel co-developed with writer Lizz Lunney.", "Chapter 1 is out on Patreon.", "Launching in 2027."]
  },
  {
    slug: "olliolli-world",
    title: "OlliOlli World",
    kind: "studio",
    year: "2022",
    with: "Roll7",
    role: "Art and visual style",
    shape: "wide",
    tone: "#f08fa8",
    images: [],
    notes: [
      "Art and visual style for the whole game and its DLCs.",
      "Characters, environments, props, storyboards, marketing images.",
      "BAFTA nominated. TIGA winner, Best Visual Design."
    ]
  },
  {
    slug: "colorpoop",
    title: "Colorpoop",
    kind: "own",
    year: "",
    with: "Opensandwich",
    role: "Short film, own IP",
    shape: "square",
    tone: "#b9a2e6",
    images: [],
    notes: ["A personal world told through 2D animation, comic panels, 3D and physical products."]
  },
  {
    slug: "valorant",
    title: "Valorant",
    kind: "studio",
    year: "",
    with: "Riot Games, via West Studio",
    role: "Illustration, concept art",
    shape: "tall",
    tone: "#e8705f",
    images: [],
    notes: ["Illustrations and concepts, working with West Studio."]
  },
  {
    slug: "everdale",
    title: "Everdale",
    kind: "studio",
    year: "2019",
    with: "Supercell, via Zombot Studio",
    role: "Concept art",
    shape: "wide",
    tone: "#8fbf6a",
    images: [],
    notes: ["Concept art for Supercell's Everdale, working with Zombot Studio."]
  },
  {
    slug: "yuga-labs",
    title: "Yuga Labs",
    kind: "studio",
    year: "",
    with: "Yuga Labs",
    role: "Art Director",
    shape: "square",
    tone: "#6f8fd6",
    images: [],
    notes: ["Art Director."]
  },
  {
    slug: "las-ninas-terribles",
    title: "Las Niñas Terribles",
    kind: "studio",
    year: "",
    with: "",
    role: "Environment design, backgrounds",
    shape: "wide",
    tone: "#d99a6c",
    images: [],
    notes: ["A 10 minute animated short.", "Environment design and the whole background production."]
  },
  {
    slug: "sunnyboy-pitch-bible",
    title: "Pitch bible",
    kind: "studio",
    year: "",
    with: "Sunnyboy Entertainment",
    role: "Visual development",
    shape: "tall",
    tone: "#e3cf5a",
    images: [],
    notes: ["World building and visual development for an animation pitch bible."]
  },
  {
    slug: "art-discipline",
    title: "Art Discipline",
    kind: "own",
    year: "",
    with: "",
    role: "Newsletter, videos",
    shape: "square",
    tone: "#c9c4bb",
    images: [],
    notes: ["A monthly journal on processes and insights in art making."],
    link: { label: "artdiscipline.com", url: "https://artdiscipline.com" }
  }
];
