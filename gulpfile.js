// Build file bundling JavaScript, applying Babel/JSX transpiling (when needed) and uglifying.
var concat = require('gulp-concat');
var babel = require("gulp-babel");
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const gulp = require('gulp');
const { watch } = require('gulp');
const cleanCSS = require('gulp-clean-css');

/*
    To get Babel cooperating nicely:
        npm install --save-dev gulp-babel @babel/core
        npm install --save-dev @babel/preset-react

    Also copy in babel.config.json
*/

const PATH_WORKING_SCRIPTS = 'js';
const PATH_BUILT_SCRIPTS = '../dist/static/js';

const PATH_CSS_FILES = 'css';
const PATH_DIST_CSS = '../dist/static/styles';

function css(){
  return gulp.src([`${PATH_CSS_FILES}/*.css`])
  .pipe(cleanCSS())
  .pipe(gulp.dest(PATH_DIST_CSS));
}

function jsReact() {
    return gulp.src([
                    `${PATH_WORKING_SCRIPTS}/status.js`,
                    `${PATH_WORKING_SCRIPTS}/board.js`,
                    `${PATH_WORKING_SCRIPTS}/main.js`
                ])
        .pipe(concat('minesweeper-react.js'))
        .pipe(babel({
            presets: ["@babel/preset-react"]
          }))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(PATH_BUILT_SCRIPTS));
}

exports.default = function(){
    watch('css/*.css', css);
    watch('js/*js', jsReact);
};