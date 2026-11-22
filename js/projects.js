/*
  All site content lives here. Text is taken from germanreina.com and your notes.

  PROJECTS: to add one, copy a block and edit it.
    kind:   "studio" = games / client work, "own" = personal projects
    year:   leave "" if you'd rather not show one
    shape:  size of the piece in the lab's galleries: "wide", "tall" or "square"
    tone:   colour of the placeholder in the lab until real images are added
    images: paths inside /images, e.g. ["images/olliolli-world/01.jpg"]
    notes:  short factual lines shown in the project sheet
    link:   optional { label, url }
*/
window.SITE = {
  name: "Germán Reina",
  // The line under the name. Other lines of yours that would fit here:
  //   "Stay creative, stay weird."   (germanreina.com, artdiscipline.com)
  //   "Creative Vision and Art Direction for Video Games and Animation."   (Notion bio)
  intro: "Art Director from Lanzarote. Creator of the art for OlliOlli World. Artist at Supercell.",
  motto: "Stay creative, stay weird.",
  email: "germanrc3@hotmail.com",
  portfolio: { label: "ArtStation", url: "https://www.artstation.com/germanreina" },

  // The four doors on the home page.
  doors: [
    { title: "Projects", sub: "Art for games", url: "#index" },
    { title: "Megalith", sub: "Graphic novel", url: "https://www.patreon.com/c/MegalithIslands/membership" },
    { title: "Art Discipline", sub: "Newsletter", url: "https://artdiscipline.com" },
    { title: "Improve your art", sub: "Mentorship and free brushes", url: "https://germanreinac.gumroad.com/" }
  ],

  links: [
    { label: "Instagram", url: "https://www.instagram.com/germanreinac/" },
    { label: "ArtStation", url: "https://www.artstation.com/germanreina" },
    { label: "Behance", url: "https://www.behance.net/GERMANREINA" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/germ%C3%A1n-reina-carmona-a2627560/" },
    { label: "Art Discipline", url: "https://artdiscipline.com" },
    { label: "Photoshop Toolkit", url: "https://germanreinac.gumroad.com/l/photoshoptools" },
    { label: "Mentorship", url: "https://www.trojan-unicorn.com/village/spaces/102-guidance-sessions/mentorships/offers/773-character-design" }
  ],

  about: {
    lead: "Visual Artist and Art Director from Lanzarote.",
    text: "Creative Vision & Worldbuilding for game and animation IPs. Creator of the art and visual style for OlliOlli World (BAFTA nominated). Worked with companies like Supercell, Riot Games, Psyop, Rovio, and more.",
    photo: { src: "images/about/talk.jpg", alt: "Germán Reina speaking at Pictoplasma 2023", credit: "Photo: Diego Castro" },
    experience: [
      { who: "Supercell", when: "Nov 2024 – Present", what: "Concept Artist on Clash of Clans" },
      { who: "UMA Games", when: "Apr 2024 – Oct 2024", what: "Art Direction / Concept Art on Project Cubit" },
      { who: "Périple Studio", when: "Aug 2024", what: "Art Direction / Concept Art on Tales Up" },
      { who: "Yuga Labs", when: "Apr 2023 – Dec 2023", what: "Art Director" },
      { who: "Rovio", when: "Oct 2022 – Jan 2023", what: "Environment Concept Artist on New IP" },
      { who: "Roll7", when: "Dec 2019 – Oct 2022", what: "Principal Concept Artist on OlliOlli World & New IPs" },
      { who: "West Studio", when: "Aug 2019 – Apr 2020 & Mar 2021 – Apr 2021", what: "Concept Artist on Valorant" }
    ],
    talks: [
      { title: "Pictoplasma 2023, Berlin", sub: "OlliOlli World Conference and Comic Book Announcement", url: "https://youtu.be/4uVsOS7GGRk?si=WlZELf_zXIRs9Su3" },
      { title: "Themepark Finland 2022, Helsinki", sub: "“Is This Concept Art?”", url: "https://www.youtube.com/watch?v=gL5qR4yk3eg&t=46s" },
      { title: "Vertex Week 2022, London", sub: "“Improve Your Character Design”", url: "https://www.creativebloq.com/how-to/improve-your-character-design" },
      { title: "Studio Creaturas Interview 2022 (Spanish)", sub: "Art for Video Games Podcast", url: "https://www.youtube.com/watch?v=40vNTJXTNIY&t=1s" }
    ]
  }
};

window.PROJECTS = [
  {
    slug: "clash-of-clans",
    title: "Clash of Clans",
    kind: "studio",
    year: "2024–now",
    with: "Supercell",
    role: "Concept artist",
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
    notes: ["Graphic novel co-developed with writer Lizz Lunney.", "Chapter 1 is out on Patreon.", "Launching in 2027."],
    link: { label: "Megalith on Patreon", url: "https://www.patreon.com/c/MegalithIslands/membership" }
  },
  {
    slug: "olliolli-world",
    title: "OlliOlli World",
    kind: "studio",
    year: "2019–22",
    with: "Roll7",
    role: "Principal concept artist",
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
    notes: ["A personal world told through 2D animation, comic panels, 3D and physical products."],
    link: { label: "colorpoop.com", url: "http://www.colorpoop.com" }
  },
  {
    slug: "valorant",
    title: "Valorant",
    kind: "studio",
    year: "2019–21",
    with: "Riot Games, via West Studio",
    role: "Concept artist",
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
    year: "2023",
    with: "Yuga Labs",
    role: "Art Director",
    shape: "square",
    tone: "#6f8fd6",
    images: [],
    notes: ["Art Director."]
  },
  {
    slug: "project-cubit",
    title: "Project Cubit",
    kind: "studio",
    year: "2024",
    with: "UMA Games",
    role: "Art direction, concept art",
    shape: "wide",
    tone: "#74c2c9",
    images: [],
    notes: ["Art direction and concept art."],
    link: { label: "UMA Games", url: "https://www.uma.games/playtest" }
  },
  {
    slug: "tales-up",
    title: "Tales Up",
    kind: "studio",
    year: "2024",
    with: "Périple Studio",
    role: "Art direction, concept art",
    shape: "square",
    tone: "#e6a6c8",
    images: [],
    notes: ["Art direction and concept art."],
    link: { label: "Tales Up", url: "https://talesup.io/" }
  },
  {
    slug: "rovio-new-ip",
    title: "New IP",
    kind: "studio",
    year: "2022–23",
    with: "Rovio",
    role: "Environment concept artist",
    shape: "wide",
    tone: "#d86f5a",
    images: [],
    notes: ["Environment concept art for a new IP."]
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
