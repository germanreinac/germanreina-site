# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

## The provisional site (`index.html`)

Three views, switched by the address:

- `#home`: dark home with the looping Ra video behind the name, and four doors (Projects, Megalith, Art Discipline, Improve your art).
- `#work`: a plain list of projects with filters. Each row opens a sheet with the facts; images are on ArtStation for now.
- `#about`: bio, contact, links, experience, talks and workshops.

Files: `index.html`, `css/site.css`, `js/site.js`, and the content in `js/projects.js`.

### Editing content

Everything is in `js/projects.js`: the line under the name, the home doors, links, the about text, experience, talks, and one block per project.

To add images to a project, put them in `images/<project-slug>/` and list the paths in that project's `images` array. They show in the project sheet, and the ArtStation link for that project goes away.

The home video is `images/home/ra.mp4` with `images/home/ra-poster.jpg` as its still.

## The lab (`lab.html`)

Interactive home screens being tried out. Not linked from the provisional site. A switch at the top right chooses between them:

- `lab.html#gallery`: walkable platforms floating in space, with figures to shove around and a jump-off spiral of projects (`js/walk.js`).
- `lab.html#warehouse`: a warehouse with long arms reaching out of it, one project hanging from each (`js/homes.js`).
- `lab.html#island`: a floating island with the artist drawing at a desk, the projects circling as loose pages (`js/homes.js`).

Files: `lab.html`, `css/style.css`, `js/main.js`, `js/walk.js`, `js/homes.js`, `js/vendor/three.min.js`. The figures are plain stand-ins and the pieces are coloured placeholders until the art is made.
