# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

## The site (`index.html`)

Two views, switched from the bar at the top:

- **Gallery** (`#gallery`): the home page. Your name and the line under it beside the looping Ra video from the current site, centred. Running the pointer or a finger over the figure breaks it into dust that grows back. This stands in for the interactive gallery until its art is made.
- **Index** (`#index`): a plain list of projects with filters. Each row opens a sheet with the facts; images are on ArtStation for now.

There is no About page for now. Its content (bio, contact, links, experience, talks) is still in `js/projects.js` under `about`, and `js/main.js` still knows how to build it if an About view is added back to `index.html`.

Files: `index.html`, `css/style.css`, `js/main.js`, and the content in `js/projects.js`. The home video is `images/home/ra.mp4` with `images/home/ra-poster.jpg` as its still.

### Editing content

Everything is in `js/projects.js`: the line under the name, the home doors, links, the about text, experience, talks, and one block per project.

To add images to a project, put them in `images/<project-slug>/` and list the paths in that project's `images` array. The first one hangs in the gallery; all of them show in the project sheet, and the ArtStation link for that project goes away.

## The lab (`lab.html`)

The interactive home screens, for when the art is ready. Not linked from the site. Same bar and Index, with a switch at the top right between:

- the walkable gallery of platforms floating in space, with figures to shove around and a jump-off spiral of projects (`js/walk.js`);
- a warehouse with long arms each holding a project (`js/homes.js`);
- a floating island where the artist draws while the projects circle as loose pages (`js/homes.js`).

The gallery building is four short lists at the top of `js/walk.js` (platforms, links, walls, hanging spots). The figures are plain stand-ins and the pieces are coloured placeholders until the art is made. To make one of these the home page, `index.html` only needs its hero block swapped for the lab's.
