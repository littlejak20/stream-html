var gulp = require('gulp'),
	watch = require('gulp-watch'),
	sass = require('gulp-sass'),
	rename = require('gulp-rename'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	cleanCSS = require('gulp-clean-css'),
	sourcemaps = require('gulp-sourcemaps');

var strDestCssPath = './public/css';

gulp.task('sass', () => {
	return sassCompile();
});
gulp.task('sass-watch', () => {
	return watch('./sass/**/*.scss', function () {
		sassCompile();
	});
});

function sassCompile() {
	return gulp.src('./sass/style.scss')
		.pipe(sass())
		//.pipe(rename({ basename: 'style' }))
		.pipe(postcss([ autoprefixer() ])) // see for browserslist in package.json
		.pipe(gulp.dest(strDestCssPath))
		.pipe(cleanCSS())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(strDestCssPath));
}