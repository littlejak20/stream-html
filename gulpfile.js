// Import everything important
const gulp = require('gulp');
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sourcemaps = require('gulp-sourcemaps');

// For SASS -> CSS
const sass = require('gulp-sass')(require('sass'));
sass.compiler = require('sass');
const sassGlob = require('gulp-sass-glob');
const Fiber = require('fibers');
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

// Define Important Varaibles
const src = './src';
const dest = './dist';

// Compile sass into css with gulp
const css = () => {
    // Find SASS
    return gulp
        .src(`${src}/sass/main.scss`)
        .pipe(sassGlob())
        // Init Plumber
        .pipe(plumber())
        // Start sourcemap
        .pipe(sourcemaps.init())
        // Compile SASS to CSS
        .pipe(sass({
            includePaths: ['./node_modules'],
            fiber: Fiber
        }).on('error', sass.logError))
        // Add suffix
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        // Add Autoprefixer & cssNano
        .pipe(postcss([autoprefixer({ grid: true }), cssnano()]))
        // Write sourcemap
        .pipe(sourcemaps.write(''))
        // Write everything to destination folder
        .pipe(gulp.dest(`${dest}/css`))
};

const script = () => { // only copy
    return gulp
        .src(`${src}/js/main.js`)
        .pipe(rename({ basename: 'main', suffix: ".min" }))
        .pipe(gulp.dest(`${dest}/js`));
};

// Just Build the Project
const build = gulp.series(css, script);

// Function to watch our Changes and refreash page
const watch = () => gulp.watch([`${src}/sass/**/*.scss`, `${src}/js/**/*.js`], build);

// All Tasks for this Project
const dev = gulp.series(css, script, watch);

// Default function (used when type gulp)
exports.dev = dev;
exports.build = build;
exports.default = build;
