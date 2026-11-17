# germanreina-site

Personal site. Plain HTML, CSS and JS, no build step. Open `index.html` or serve the folder with any static host.

Two views of the same projects:

- **Gallery** (`#gallery`): a foggy wall you walk sideways. Display first.
- **Index** (`#index`): a plain list with filters. Straight to the point.

## Editing content

Everything is in `js/projects.js`: the intro line, the links, and one block per project.

To add images, put them in `images/<project-slug>/` and list the paths in that project's `images` array. The first image is the piece on the gallery wall; all of them show in the project sheet. A project with no images shows a coloured placeholder.

## Files

- `index.html`: page shell
- `css/style.css`: all styling, colour and type tokens at the top
- `js/projects.js`: content
- `js/main.js`: gallery, index and project sheet behaviour
