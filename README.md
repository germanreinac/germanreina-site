# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

## The site (`index.html`)

Three views, switched from the bar at the top (Gallery, Index, Play):

- **Gallery** (`#gallery`): the home page. Your name and the line under it beside the looping Ra video from the current site, centred. The picture is dragged and torn along the path of the pointer or finger, with split colours, leaving a wake that takes a couple of seconds to settle. Titles and links across the site play the same glitch, briefly, when the pointer reaches them. This stands in for the interactive gallery until its art is made.
- **Index** (`#index`): a plain list of projects with filters. Each row opens a sheet with the facts; images are on ArtStation for now.

- **Play** (`#play`): the interactive sites and games, in the same light style as the Index. The names sit on the rim of a big wheel seen almost edge-on: the front runs down a diagonal, the far side shows behind, soft and faint, and scrolling spins it without end. Picking a name (pointing with a mouse, or a tap) turns it to the middle while the neighbours part and the name grows into its thumbnail, all in one movement. A click, or a tap on the thumbnail, opens the site. Left alone, the wheel keeps turning very slowly; a finger on it or an open preview holds it still. The earlier flat staircase is still at `#play-flat` (reload the page on that address). Entries are the `play` list in `js/projects.js`; previews go in `images/play/`.

The home page has a Behead button (bottom left). The figure's head pops off as a jelly head and falls to a floor seen from above, on a slightly darker background with the name softened. Drag it anywhere on screen to roll it, let go to throw it, tap it to make it jump; stretch it between two fingers and lift one, and it snaps like rubber and flies off towards the finger still holding; it fades into fog as it goes back. It can be broken several ways: stretched far too much (two fingers, or the mouse wheel while pointing at it), shaken hard from side to side, tapped over and over, or slammed down. It trembles as the strain builds, then bursts, the skull drops out, and after a glitch the whole figure returns. The picture tears where the head is touched, where it lands, where it hits the edge of the screen, and along the floor behind it as it rolls. "Put it back" sends the head flying back onto the neck before the figure returns. Head and skull are provisional ones built from simple shapes in `buildHead()` in `js/main.js`, to be replaced by the real models.

**About** (`#about`) is not in the bar: clicking the name on the home page opens it. It has the bio, contact, links, experience and talks from `js/projects.js`.

Files: `index.html`, `css/style.css`, `js/main.js`, and the content in `js/projects.js`. The home video is `images/home/ra.mp4` with `images/home/ra-poster.jpg` as its still.

### Editing content

Everything is in `js/projects.js`: the line under the name, the home doors, links, the about text, experience, talks, and one block per project.

Until a project has images of its own, the Index hover preview shows one of ten stand-in pictures from `images/placeholder/` (existing pictures of yours, in no particular order). To add images to a project, put them in `images/<project-slug>/` and list the paths in that project's `images` array. The first one hangs in the gallery; all of them show in the project sheet, and the ArtStation link for that project goes away.

## The lab (`lab.html`)

The interactive home screens, for when the art is ready. Not linked from the site. Same bar and Index, with a switch at the top right between:

- the walkable gallery of platforms floating in space, with figures to shove around and a jump-off spiral of projects (`js/walk.js`);
- a warehouse with long arms each holding a project (`js/homes.js`);
- a floating island where the artist draws while the projects circle as loose pages (`js/homes.js`).

The gallery building is four short lists at the top of `js/walk.js` (platforms, links, walls, hanging spots). The figures are plain stand-ins and the pieces are coloured placeholders until the art is made. To make one of these the home page, `index.html` only needs its hero block swapped for the lab's.
