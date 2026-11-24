# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

## The site (`index.html`)

Three views, switched from the bar at the top (Gallery, Index, Play):

- **Gallery** (`#gallery`): the home page. Your name and the line under it beside the looping Ra video from the current site, centred. The picture is dragged and torn along the path of the pointer or finger, with split colours, leaving a wake that takes a couple of seconds to settle. Titles and links across the site play the same glitch, briefly, when the pointer reaches them. This stands in for the interactive gallery until its art is made.
- **Index** (`#index`): a plain list of projects with filters. Each row opens a sheet with the facts; images are on ArtStation for now.

- **Play** (`#play`): the interactive sites and games, in the same light style as the Index. The names run down a long diagonal staircase that carries on past the screen; scrolling slides it along that diagonal. Clicking a name picks it: the others fly apart along the diagonal and, half a second later, a preview opens behind it. Clicking it again opens the site. Entries are the `play` list in `js/projects.js`; previews go in `images/play/`.

The home page has a Behead button (bottom left). The figure's head pops off as a jelly head and falls to a floor seen from above, on a slightly darker background with the name softened. Drag it anywhere on screen to roll it, let go to throw it, tap it to make it jump; it fades into fog as it goes back. Stretch it with two fingers (or the mouse wheel while pointing at it): pulled much too far, it bursts, the skull drops out, and after a glitch the whole figure returns. Head and skull are provisional ones built from simple shapes in `buildHead()` in `js/main.js`, to be replaced by the real models.

**About** (`#about`) is not in the bar: clicking the name on the home page opens it. It has the bio, contact, links, experience and talks from `js/projects.js`.

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
