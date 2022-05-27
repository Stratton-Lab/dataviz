# unnamed dataviz project

this project is currently unnamed, but contains code for a data visualisation project, runnable from the browser

## DISCLAIMER

this project is currently in the very early stages and highly unfinished, many features are not implemented and there has been little effort to ensure good code quality and documentation.

## contributing

if you wish to add your dataset to this project, please make a PR and add the corresponding files to the `public` directory.
please remember to also edit `src/datasets.json` with the name of your new dataset.

## planned feature list

- allow for multiple conditions to be expressed
- differentiate points after subsetting by expression levels
  - further opacity modification ?
  - 3 dimensional plot ?
  - create a second plot ?
- search box for genes
- styling/design
- add annotations for some genes to reference known related research

## license

code in this repository is licensed under the GPL, please see `license.txt` for details

## development

this project uses [vite](https://vitejs.dev/) as its build/development tool.
[pnpm](https://pnpm.io/) is used for dependency/project management.

the following scripts are configured in the directory:

- `pnpm run dev`

  runs the app in development mode, serving it to [http://localhost:3000](http://localhost:3000).
  any edits will cause a reload.

- `pnpm run serve`

  runs the app in production mode, serving it to [http://localhost:3000](http://localhost:3000).
  any edits will cause a reload.

- `pnpm run build`

  builds the app for production, and the resulting build is stored in `dist` folder.

- `pnpm run test`

  runs tests.
  