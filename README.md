# FxTree

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.5.2.

## Demo

https://feberhard.github.io/fxtree/

## Features
- Fast virtualized tree
- Drag and Drop

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Deploy Demo
https://github.com/angular-schule/angular-cli-ghpages

Install angular-cli-ghpages 
```
npm i -g angular-cli-ghpages
```

Build and deploy to gh-pages branch
```
ng build --prod --base-href "https://feberhard.github.io/fxtree/"
ngh
```

## Bundle Analyzer

Generate stats.json with or without `--prod` flag
```
ng build --prod --stats-json
```

Run bundle analyzer
```
npm run bundle-report
```


## Next Steps
- Two way nodes binding
- Node Selection
  - Checkbox
    - Drag and Drop
- Virtualization (preload more rows and add additional rows instead of replacing all everytime)
- support angular templates for node content
