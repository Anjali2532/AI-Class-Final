## File glossary

- `src/App.jsx` - Main React component. It contains the grid, controls, BFS and A* search logic, and search results.
- `src/App.css` - Styles for the visualizer interface, grid cells, controls, and responsive layout.
- `src/index.css` - Global page styles and the base font and background settings.
- `src/main.jsx` - Starts the React app and places `App` on the page.
- `public/` - Static files that can be served directly by Vite.
- `index.html` - The HTML page that loads the React app.
- `package.json` - Lists project dependencies and commands such as `npm run dev`, `npm run build`, and `npm run lint`.
- `vite.config.js` - Configuration for the Vite development server and build process.
- `todo.txt` - Advanced project requirements that are not included in this basic prototype.
- `.gitignore` - Lists local files and generated folders Git should not track.

## How to run

1. Open a terminal in the project folder.
2. Install dependencies:

	```bash
	npm install
	```

3. Start the development app:

	```bash
	npm run dev
	```

4. Open the local URL shown in the terminal, usually `http://localhost:5173/`.

To create a production build, run `npm run build`. To check the code, run `npm run lint`.
