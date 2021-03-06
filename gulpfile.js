// Import everything important
const gulp = require('gulp');
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const browserSync = require('browser-sync').create();
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');

// For SASS -> CSS
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
//const sassLint = require('gulp-sass-lint');

// HTML
const htmlmin = require('gulp-htmlmin');

// JavaScript/TypeScript
const browserify = require('browserify');
const babel = require('gulp-babel');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');
const concat = require('gulp-concat');

// JavaScript / TypeScript (new)
const terser = require('gulp-terser-js');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

// Define Important Varaibles
const src = './src';
const dest = './dist';

// Function for reload the Browser
const reload = (done) => {
    browserSync.reload();
    done();
};

// Function for serve the dev server in borwsaer
const serve = (done) => {
    browserSync.init({
        server: {
            baseDir: `${dest}`
        }
    });
    done();
};

// Compile sass into css with gulp
const css = () => {
    // Find SASS
    return gulp
        .src(`${src}/sass/main.scss`)
        .pipe(sassGlob())
        // Init Plumber
        .pipe(plumber())
        // Lint SASS
        /*.pipe(sassLint({
            options: {
                formatter: 'stylish',
            },
            rules: {
                'no-ids': 1,
                'final-newline': 0,
                'no-mergeable-selectors': 1,
                'indentation': 0
            }
        }))*/
        // Format SASS
        //.pipe(sassLint.format())
        // Start Source Map
        .pipe(sourcemaps.init())
        // Compile SASS -> CSS
        .pipe(sass.sync({ outputStyle: "compressed" })).on('error', sass.logError)
        // add SUffix
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // Add Autoprefixer & cssNano
        .pipe(postcss([autoprefixer({
            grid: true
        }), cssnano()]))
        // Write Source Map
        .pipe(sourcemaps.write(''))
        // Write everything to destination folder
        .pipe(gulp.dest(`${dest}/css`))
        // Reload Page
        //.pipe(browserSync.stream());
};

// Compile .html to minify .html
const html = () => {
    // Find HTML
    return gulp
        .src(`${src}/html/**/*.html`)
        // Init Plumber
        .pipe(plumber())
        // Compile SASS -> CSS
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            html5: true,
            removeEmptyAttributes: true,
            removeTagWhitespace: true,
            sortAttributes: true,
            sortClassName: true
        }))
        // Write everything to destination folder
        .pipe(gulp.dest(`${dest}`));
};

const script = () => {
    return browserify(`${src}/js/main.js`, { debug: true })
        .transform('babelify', {
            presets: ['babel-preset-env'],
            plugins: ['babel-plugin-transform-runtime']
        }).plugin('tinyify')
        .bundle()
        .pipe(source(`main.min.js`))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(terser())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${dest}/js`));
};

// Compile .js to minify .js
const scriptOld = () => {
    // Find JS
    return gulp
        .src(`${src}/js/**/*.js`)
        // Init Plumber
        .pipe(plumber(((error) => {
            gutil.log(error.message);
        })))
        // Start useing source maps
        .pipe(sourcemaps.init())
        // concat
        .pipe(concat('concat.js'))
        // Use Babel
        .pipe(babel({
          "presets": [
            [
              "@babel/preset-env",
              /*{
                "useBuiltIns": "entry"
              }*/
            ]
          ]
        }))
        /*.pipe(babel({
          "presets": [
            ["@babel/env", {
              "modules": false
            }]
          ],
          "plugins": [
            [
              "@babel/plugin-transform-runtime",
              {
                "absoluteRuntime": false,
                "corejs": false,
                "helpers": true,
                "regenerator": true,
                "useESModules": false,
                "version": "7.0.0-beta.0"
              }
            ]
          ]
        }))*/

        /*.pipe(rename({ basename: 'main', suffix: ".babel" }))
        .pipe(gulp.dest(`${dest}/js`))*/

        // JavaScript Lint
        .pipe(jshint())
        // Report of jslint
        .pipe(jshint.reporter('jshint-stylish'))
        // Add browser Support
        .pipe(browserify({
            insertGlobals: true
        }))

        /*.pipe(rename({ basename: 'main' }))
        .pipe(gulp.dest(`${dest}/js`))*/

        // Minify
        .pipe(uglify())
        //.pipe(minify())
        // add SUffix
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // Write Sourcemap
        .pipe(sourcemaps.write(''))
        // Write everything to destination folder
        .pipe(gulp.dest(`${dest}/js`))
        // Update Browser
        //.pipe(browserSync.stream());
};




const minifyClassNames = require('./tools/minifyClassNames.js');
gulp.task('minify-css-names', (done) => {
    minifyClassNames([
        { input: `dist/css/main.min.css`, output: `dist/css/main.min.cssmin.css` },
        { input: `dist/js/main.min.js`,   output: `dist/js/main.min.cssmin.js` },
        { input: `dist/config.html`,      output: `dist/config.cssmin.html` },
        { input: `dist/view.html`,        output: `dist/view.cssmin.html` }
    ]);

    done();
});






// Just Build the Project
const build = gulp.series(css, script, html);

// Function to watch our Changes and refreash page
//const watch = () => gulp.watch([`${src}/html/**/*.html`, `${src}/js/**/*.js`, `${src}/sass/**/*.scss`], gulp.series(css, script, html, reload));
const watch = () => gulp.watch([`${src}/html/**/*.html`, `${src}/js/**/*.js`, `${src}/sass/**/*.scss`], build);

// All Tasks for this Project
//const dev = gulp.series(css, script, html, serve, watch);
const dev = gulp.series(css, script, html, watch);

// Default function (used when type gulp)
exports.dev = dev;
exports.build = build;
exports.default = build;
