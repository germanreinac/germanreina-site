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
  intro: "Art Director from Lanzarote, currently at Supercell.\nCreator of the art for OlliOlli World.", // \n starts a new line
  nameHint: "who's this? ↓", // small line above the name on the home page; it and the name open About
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

  // Which of the links below show at the foot of the Index.
  footLinks: ["Instagram", "ArtStation", "Mentorship"],

  links: [
    { label: "Instagram", url: "https://www.instagram.com/germanreinac/" },
    { label: "ArtStation", url: "https://www.artstation.com/germanreina" },
    { label: "Behance", url: "https://www.behance.net/GERMANREINA" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/germ%C3%A1n-reina-carmona-a2627560/" },
    { label: "Art Discipline", url: "https://artdiscipline.com" },
    { label: "Photoshop Toolkit", url: "https://germanreinac.gumroad.com/l/photoshoptools" },
    { label: "Mentorship", url: "https://germanreinac.gumroad.com/l/cldiu" } // the 1-on-1 Mentorship Session product
  ],

  // The Play page: interactive sites and games. One line each.
  //   domain: what is shown in the list      url: where it goes ("" = not live yet)
  //   image:  a screenshot or GIF shown behind the list on hover, e.g. "images/play/name.jpg"
  //   tone:   background colour used until there is an image
  //   live:   true once the site is launched. Entries without it stay on the wheel blurred and cannot be picked.
  play: [
    { domain: "artdiscipline.com", url: "https://artdiscipline.com", note: "Newsletter site", image: "images/play/artdiscipline.jpg", tone: "#2b2631", live: true },
    { domain: "colorpoop.com", url: "http://www.colorpoop.com", note: "Colorpoop", image: "", tone: "#b9a2e6" },
    // Everything below is a stand-in so the staircase is long enough to scroll. Replace with real sites.
    { domain: "megalith interactive", url: "", note: "Stand-in", image: "", tone: "#7fa7a0" },
    { domain: "sketchpoop", url: "", note: "Stand-in", image: "", tone: "#f08fa8" },
    { domain: "matrioska", url: "", note: "Stand-in", image: "", tone: "#6f8fd6" },
    { domain: "canarias en venta", url: "", note: "Stand-in", image: "", tone: "#e8705f" },
    { domain: "spiral staircase", url: "", note: "Stand-in", image: "", tone: "#c9c4bb" },
    { domain: "shopping carts", url: "", note: "Stand-in", image: "", tone: "#8fbf6a" },
    { domain: "tower climber", url: "", note: "Stand-in", image: "", tone: "#e3cf5a" },
    { domain: "halloween hunter", url: "", note: "Stand-in", image: "", tone: "#d99a6c" },
    { domain: "fractal refs", url: "", note: "Stand-in", image: "", tone: "#74c2c9" },
    { domain: "psd coloring tool", url: "", note: "Stand-in", image: "", tone: "#e6a6c8" }
  ],

  about: {
    lead: "Visual Artist from Lanzarote.",
    text: "Creative Vision & Worldbuilding for video games. Creator of the art and visual style for OlliOlli World (BAFTA nominated).",
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
    with: "Own project",
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
    with: "Own project",
    role: "Short film, own IP",
    shape: "square",
    tone: "#b9a2e6",
    images: [],
    notes: ["A personal world told through 2D animation, comic panels, 3D and physical products.", "Short film animated with Opensandwich."],
    link: { label: "colorpoop.com", url: "http://www.colorpoop.com" }
  },
  {
    slug: "valorant",
    title: "Valorant",
    kind: "studio",
    year: "2019–21",
    with: "Riot Games",
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
    with: "Supercell",
    role: "Concept art",
    shape: "wide",
    tone: "#8fbf6a",
    images: [],
    notes: ["Concept art for Supercell's Everdale, working with Zombot Studio."],
    // A project with a `page` opens as its own page from the Work list instead of the side sheet.
    //   line:     one sentence under the title
    //   facts:    pairs shown in a row under it
    //   glance:   the strongest finished sheets, shown first and large
    //   chapters: one per place or subject. `finals` are shown; `process` is folded away under
    //             "How it got there", one entry per round, each with its own images.
    // Text in [square brackets] and every image here is a stand-in until the real ones are in.
    page: {
      line: "[One line: what Everdale was and what you did on it.]",
      facts: [["Role", "Concept art"], ["Client", "Supercell, with Zombot Studio"], ["Year", "2019"], ["Scope", "[What you were responsible for]"]],
      glance: [
        { src: "images/placeholder/01.jpg", caption: "Capitol wonders" },
        { src: "images/placeholder/04.jpg", caption: "Main village" },
        { src: "images/placeholder/08.jpg", caption: "Guild woodcutter" },
        { src: "images/placeholder/05.jpg", caption: "Campus Capitol" }
      ],
      chapters: [
        { id: "main-village", title: "Main Village", brief: "[One sentence on the brief for the village.]",
          finals: [
            { src: "images/placeholder/04.jpg", caption: "Square, Home and Library thumbnails" },
            { src: "images/placeholder/02.jpg", caption: "Tavern" }
          ] },
        { id: "campus-capitol", title: "Campus Capitol", brief: "[One sentence on the brief for the Capitol.]",
          finals: [
            { src: "images/placeholder/05.jpg", caption: "Change on direction, 22 Nov 2019" }
          ],
          process: [
            { label: "Start", items: [{ src: "images/placeholder/01.jpg", caption: "Capitol wonders, 4 Oct 2019" }] },
            { label: "Round 1", items: [
              { src: "images/placeholder/03.jpg", caption: "First sketches, 10 Oct" },
              { src: "images/placeholder/06.jpg", caption: "First sketches, 17 Oct" },
              { src: "images/placeholder/09.jpg", caption: "Sketch boards" }] },
            { label: "Round 2", items: [
              { src: "images/placeholder/02.jpg", caption: "Main building, new shape" },
              { src: "images/placeholder/07.jpg", caption: "Feedback" },
              { src: "images/placeholder/04.jpg", caption: "Applied more in context, more complex structure" },
              { src: "images/placeholder/08.jpg", caption: "Polished structure and materials" }] },
            { label: "Round 3", items: [
              { src: "images/placeholder/07.jpg", caption: "Feedback" },
              { src: "images/placeholder/01.jpg", caption: "31 Oct" },
              { src: "images/placeholder/10.jpg", caption: "Tower variations" },
              { src: "images/placeholder/06.jpg", caption: "Tower variations" }] },
            { label: "Round 4", items: [
              { src: "images/placeholder/05.jpg", caption: "New sketches with variations" },
              { src: "images/placeholder/03.jpg", caption: "Change on direction" }] }
          ] },
        { id: "guilds", title: "Guilds", brief: "[One sentence on the brief for the guild buildings.]",
          finals: [
            { src: "images/placeholder/08.jpg", caption: "Guild woodcutter" },
            { src: "images/placeholder/09.jpg", caption: "Guild buildings thumbnails" }
          ] },
        { id: "support", title: "Support and resource buildings", brief: "[One sentence on these.]",
          finals: [
            { src: "images/placeholder/02.jpg", caption: "Saw Mill and Wood Storage" },
            { src: "images/placeholder/04.jpg", caption: "Stone Storage, Clay Pit, House of Potions" },
            { src: "images/placeholder/01.jpg", caption: "Stone pit" },
            { src: "images/placeholder/05.jpg", caption: "Pumpkin patch" }
          ] }
      ]
    }
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
    slug: "rovio-new-game",
    title: "New game",
    kind: "studio",
    year: "2022–23",
    with: "Rovio",
    role: "Environment concept artist",
    shape: "wide",
    tone: "#d86f5a",
    images: [],
    notes: ["Environment concept art for a new game."]
  },
  {
    slug: "hourglass-moonland",
    title: "Hourglass Moonland",
    kind: "studio",
    year: "",
    with: "",
    role: "TV show pitch",
    shape: "tall",
    tone: "#e3cf5a",
    images: [],
    notes: ["Visual development for a TV show pitch."]
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
  }
];
