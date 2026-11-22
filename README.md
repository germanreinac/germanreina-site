# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

## The site (`index.html`)

Three views, switched from the bar at the top:

- **Gallery** (`#gallery`): the home page. Your name, the line under it and four doors (Projects, Megalith, Art Discipline, Improve your art) sit beside a walkable gallery of platforms floating in space. Click a floor or stair to walk, click a piece to visit it, bump into the other figures to shove them, click outside to jump off and scroll down through the projects.
- **Index** (`#index`): a plain list of projects with filters. Each row opens a sheet with the facts; images are on ArtStation for now.
- **About** (`#about`): bio, contact, links, experience, talks and workshops.

Files: `index.html`, `css/style.css`, `js/main.js`, `js/walk.js`, `js/vendor/three.min.js`, and the content in `js/projects.js`. Without WebGL the gallery falls back to a flat side-scrolling wall.

### Editing content

Everything is in `js/projects.js`: the line under the name, the home doors, links, the about text, experience, talks, and one block per project.

To add images to a project, put them in `images/<project-slug>/` and list the paths in that project's `images` array. The first one hangs in the gallery; all of them show in the project sheet, and the ArtStation link for that project goes away.

The gallery building is four short lists at the top of `js/walk.js` (platforms, links, walls, hanging spots). It has room for seven studio pieces and four of your own; projects beyond that are in the Index and the scroll, but not on a wall.

## The lab (`lab.html`)

Other interactive home screens being tried out. Not linked from the site. A switch at the top right chooses between the gallery, a warehouse with long arms each holding a project, and a floating island where the artist draws while the projects circle as loose pages (`js/homes.js`).

The figures are plain stand-ins and the pieces are coloured placeholders until the art is made. `images/home/` holds the Ra video loop and still from the current site, not used yet.
