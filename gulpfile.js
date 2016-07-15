var gulp = require("gulp");
var babel = require("gulp-babel");
//var $ = require("gulp-load-plugins")();
var exec = require('gulp-exec');
var gsFileName = [
    "JIMSystem",
    "uploadScripts"
];

gulp.task("cvrt", function () {
    gsFileName.forEach(function (fName) {
        gulp.src("./jimsystem/gas/" + fName + "/src/*.js")
        .pipe(babel())
        .pipe(gulp.dest("./jimsystem/gas/" + fName + "/src_babel_es5"));
    })
    gulp.src("./jimsystem/server/**/*.js")
        .pipe(babel())
        .pipe(gulp.dest("./jimsystem/server_es5"));
});
