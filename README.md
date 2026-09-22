# Relive

Catálogo web estático de productos Relive, generado con Pug, SCSS y JavaScript.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` construye `dist` y lo publica automáticamente cada vez que hay un push a `main`.

Para activarlo en el repositorio:

1. Sube el proyecto a GitHub y asegúrate de usar la rama `main`.
2. En **Settings > Pages**, selecciona **GitHub Actions** como fuente de publicación.
3. Ejecuta el workflow desde **Actions > Publicar Relive en GitHub Pages**, o haz un push a `main`.

La URL tendrá este formato:

```text
https://TU_USUARIO.github.io/NOMBRE_DEL_REPOSITORIO/
```

El sitio publicado corresponde al contenido generado en `dist`. Para probar el build localmente:

```bash
npm ci
npm run build
```

## Desarrollo local

```bash
npm start
```

El catálogo se genera a partir de `src/data` y las plantillas están en `src/pug`.

## Licencia

Este proyecto conserva la licencia MIT incluida en [LICENSE](LICENSE).

<!--

# [Start Bootstrap - Shop Homepage](https://startbootstrap.com/template/shop-homepage/)

[Shop Homepage](https://startbootstrap.com/template/shop-homepage/) is a basic HTML online store homepage template for [Bootstrap](https://getbootstrap.com/) created by [Start Bootstrap](https://startbootstrap.com/).

## Preview

[![Shop Homepage Preview](https://assets.startbootstrap.com/img/screenshots/templates/shop-homepage.png)](https://startbootstrap.github.io/startbootstrap-shop-homepage/)

**[View Live Preview](https://startbootstrap.github.io/startbootstrap-shop-homepage/)**

## Status

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/StartBootstrap/startbootstrap-shop-homepage/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/startbootstrap-shop-homepage.svg)](https://www.npmjs.com/package/startbootstrap-shop-homepage)

## Download and Installation

To begin using this template, choose one of the following options to get started:

* [Download the latest release on Start Bootstrap](https://startbootstrap.com/template/shop-homepage/)
* Install via npm: `npm i startbootstrap-shop-homepage`
* Clone the repo: `git clone https://github.com/StartBootstrap/startbootstrap-shop-homepage.git`
* [Fork, Clone, or Download on GitHub](https://github.com/StartBootstrap/startbootstrap-shop-homepage)

## Usage

### Basic Usage

After downloading, simply edit the HTML and CSS files included with `dist` directory. These are the only files you need to worry about, you can ignore everything else! To preview the changes you make to the code, you can open the `index.html` file in your web browser.

### Advanced Usage

Clone the source files of the theme and navigate into the theme's root directory. Run `npm install` and then run `npm start` which will open up a preview of the template in your default browser, watch for changes to core template files, and live reload the browser when changes are saved. You can view the `package.json` file to see which scripts are included.

#### npm Scripts

* `npm run build` builds the project - this builds assets, HTML, JS, and CSS into `dist`
* `npm run build:assets` copies the files in the `src/assets/` directory into `dist`
* `npm run build:pug` compiles the Pug located in the `src/pug/` directory into `dist`
* `npm run build:scripts` brings the `src/js/scripts.js` file into `dist`
* `npm run build:scss` compiles the SCSS files located in the `src/scss/` directory into `dist`
* `npm run clean` deletes the `dist` directory to prepare for rebuilding the project
* `npm run start:debug` runs the project in debug mode
* `npm start` or `npm run start` runs the project, launches a live preview in your default browser, and watches for changes made to files in `src`

You must have npm installed in order to use this build environment.

## Bugs and Issues

Have a bug or an issue with this template? [Open a new issue](https://github.com/StartBootstrap/startbootstrap-shop-homepage/issues) here on GitHub or leave a comment on the [template overview page at Start Bootstrap](https://startbootstrap.com/template/shop-homepage/).

## About

Start Bootstrap is an open source library of free Bootstrap templates and themes. All of the free templates and themes on Start Bootstrap are released under the MIT license, which means you can use them for any purpose, even for commercial projects.

* <https://startbootstrap.com>
* <https://twitter.com/SBootstrap>

Start Bootstrap was created by and is maintained by **[David Miller](https://davidmiller.io/)**.

* <https://davidmiller.io>
* <https://twitter.com/davidmillerhere>
* <https://github.com/davidtmiller>

Start Bootstrap is based on the [Bootstrap](https://getbootstrap.com/) framework created by [Mark Otto](https://twitter.com/mdo) and [Jacob Thorton](https://twitter.com/fat).

## Copyright and License

Copyright 2013-2023 Start Bootstrap LLC. Code released under the [MIT](https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE) license.
-->
