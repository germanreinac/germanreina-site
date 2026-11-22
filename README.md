# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

Two views of the same projects:

- **Gallery** (`#gallery`): a few platforms floating in dark space, seen in isometric view: an entrance, a long hall, a balcony and a tower, joined by floating stairs and a bridge, with art on the walls. Click a floor or stair to walk, click a piece to visit it. Click out in space and the figure jumps off where the edge is open (walls stop it); the fall is a second way to browse: as you scroll, the projects spiral up around the falling figure. Other stand-in figures wander the platforms: walk into one to shove it, click one to throw it, and send it past an open edge to throw it out. The building is four short lists at the top of `js/walk.js` (platforms, links, walls, hanging spots). Falls back to a flat side-scrolling wall without WebGL.
- **Index** (`#index`): a plain list with filters. Straight to the point.

## Home screens being tried

The gallery has a small switch (top right) between three home screens, so they can be compared before choosing one:

- `#gallery`: the walkable platforms described above (`js/walk.js`).
- `#warehouse`: a warehouse with long arms reaching out of it, one project hanging from each.
- `#island`: a floating island with the artist drawing at a desk, the projects circling as loose pages.

The last two live in `js/homes.js`. The artist figure is a plain stand-in.

## Editing content

Everything is in `js/projects.js`: the intro line, the links, and one block per project.

To add images, put them in `images/<project-slug>/` and list the paths in that project's `images` array. The first image is the piece on the gallery wall; all of them show in the project sheet. A project with no images shows a coloured placeholder.

## Files

- `index.html`: page shell
- `css/style.css`: all styling, colour and type tokens at the top
- `js/projects.js`: content
- `js/walk.js`: the walkable 3D gallery (three.js, vendored in `js/vendor/`)
- `js/main.js`: flat wall fallback, index and project sheet behaviour
