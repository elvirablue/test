let gulp     = require('gulp'),
	pug = require('gulp-pug'),
	pugbem = require('gulp-pugbem'),
	realFavicon = require ('gulp-real-favicon'),
	fs = require('fs'),
	browserSync  = require('browser-sync').create(),
	sass         = require('gulp-sass')(require('sass')),
	prefixer = require('gulp-autoprefixer'),
	cssmin     = require('gulp-clean-css'),
	concat = require('gulp-concat'),
	uglify       = require('gulp-uglify'),
	fileinclude = require('gulp-file-include'),
	gcmq = require('gulp-group-css-media-queries'),
    svgSprite = require('gulp-svg-sprite');

// File where the favicon markups are stored
let FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
	realFavicon.generateFavicon({
		masterPicture: 'src/favicon.svg',
		dest: 'docs/img/favicon/',
		iconsPath: 'img/favicon/',
		design: {
			ios: {
				pictureAspect: 'noChange',
				assets: {
					ios6AndPriorIcons: false,
					ios7AndLaterIcons: false,
					precomposedIcons: false,
					declareOnlyDefaultIcon: true
				}
			},
			desktopBrowser: {
				design: 'raw'
			},
			windows: {
				pictureAspect: 'noChange',
				backgroundColor: '#da532c',
				onConflict: 'override',
				assets: {
					windows80Ie10Tile: false,
					windows10Ie11EdgeTiles: {
						small: false,
						medium: true,
						big: false,
						rectangle: false
					}
				}
			},
			androidChrome: {
				pictureAspect: 'noChange',
				themeColor: '#ffffff',
				manifest: {
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				},
				assets: {
					legacyIcon: false,
					lowResolutionIcons: false
				}
			},
			safariPinnedTab: {
				pictureAspect: 'silhouette',
				themeColor: '#5bbad5'
			}
		},
		settings: {
			scalingAlgorithm: 'Mitchell',
			errorOnImageTooSmall: false,
			readmeFile: false,
			htmlCodeFile: false,
			usePathAsIs: false
		},
		markupFile: FAVICON_DATA_FILE
	}, function() {
		done();
	});
});

// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
gulp.task('inject-favicon-markups', function() {
	return gulp.src([ 'docs/*.html' ])
		.pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
		.pipe(gulp.dest('docs'));
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
	let currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
	realFavicon.checkForUpdates(currentVersion, function (err) {
		if (err) {
			throw err;
		}
	});
});

gulp.task('pug_build', function () {
	return gulp.src('src/pug/*.pug')
		.pipe(pug({
			pretty: true,
			plugins: [pugbem]
		}))
		.pipe(gulp.dest('docs/'))
		.pipe(browserSync.stream());
});


//gulp.task('html_build', function (done) {
//	gulp.src('src/*.html')
//		.pipe(fileinclude())
//		.pipe(gulp.dest('docs/'))
//		.pipe(browserSync.stream());
//	done();
//});

gulp.task('css_build', function (done) {
	gulp.src('src/assets/scss/*.scss')
		.pipe(sass())
		.pipe(prefixer())
		.pipe(gcmq())
		//.pipe(cssmin())
		.pipe(gulp.dest('docs/css/'))
		.pipe(browserSync.stream());
	gulp.src('src/assets/scss/*.css')
		.pipe(gulp.dest('docs/css/'))
		.pipe(browserSync.stream());
	gulp.src('node_modules/animate.css/animate.css')
		.pipe(gulp.dest('docs/css/'))
		.pipe(browserSync.stream());
	done();
});

gulp.task('js_build', function (done) {
	gulp.src('src/assets/scripts/*.js')
		.pipe(fileinclude())
		.pipe(concat('script.js'))
		.pipe(uglify())
		.pipe(gulp.dest('docs/js/'))
		.pipe(browserSync.stream());
	done();
});

gulp.task('fonts_build', function (done) {
    gulp.src('src/assets/fonts/*.*')
            .pipe(gulp.dest('docs/fonts/'))
            .pipe(browserSync.stream());
    done();
});

gulp.task('image_build', function (done) {
	gulp.src('src/img/**/*.*')
		.pipe(gulp.dest('docs/img/'))
		.pipe(browserSync.stream());
	done();
});

gulp.task('svg_sprite_build', function(done){
    const config = {
        mode: {
            stack: {
                sprite: "../sprite.svg"  //sprite file name
            }
        }
    };
    gulp.src("src/assets/svg/*.*")
            .pipe(svgSprite(config))
            .pipe(gulp.dest('docs/img/'))
            .pipe(browserSync.stream());
        done();
});

gulp.task('webServer', function(done) {
	browserSync.init({
		server: "docs/"
	});
	gulp.watch('src/pug/**/*.pug', gulp.series('pug_build', 'inject-favicon-markups'));
	gulp.watch('src/favicon.svg', gulp.series('generate-favicon'));
	//gulp.watch('src/**/*.html', gulp.series('html_build'));
	gulp.watch('src/**/*.scss', gulp.series('css_build'));
	gulp.watch('src/**/*.js', gulp.series('js_build'));
    gulp.watch('src/assets/fonts/*.*', gulp.series('fonts_build'));
	gulp.watch('src/img/**/*.*', gulp.series('image_build'));
	gulp.watch('src/assets/svg/*.*', gulp.series('svg_sprite_build'));
	done();
});

gulp.task('default',
	gulp.series(
		'pug_build',
		'inject-favicon-markups',
		//'html_build',
		'css_build',
		'js_build',
		'image_build',
		'svg_sprite_build',
		'fonts_build',
		'webServer'
	)
);
