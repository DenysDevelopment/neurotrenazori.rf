const projectFolder = require("path").basename(__dirname) || "dist";
const sourceFolder = "#src";

const fs = require("fs");

const path = {
  build: {
    html: `${projectFolder}/`,
    css: `${projectFolder}/css`,
    js: `${projectFolder}/js`,
    images: `${projectFolder}/images/`,
    favicon: `${sourceFolder}/images/favicon/`,
    fonts: `${projectFolder}/fonts/`,
  },
  src: {
    html: [`${sourceFolder}/*.html`, `!${sourceFolder}/_*.html`],
    css: `${sourceFolder}/scss/*.scss`,
    js: `${sourceFolder}/scripts/index.js`,
    images: `${sourceFolder}/images/**/*.{jpg, png, svg, gif, ico, webp}`,
    favicon: `${sourceFolder}/images/favicon/*.{png,svg,xml,ico,json,}`,
    fonts: `${sourceFolder}/fonts/*.ttf`,
  },
  watch: {
    html: `${sourceFolder}/**/*.html`,
    css: `${sourceFolder}/scss/**/*.scss`,
    js: `${sourceFolder}/scripts/**/*.js`,
    images: `${sourceFolder}/images/**/*.{jpg, png, svg, gif, ico, webp}`,
  },
  clean: `./${projectFolder}/`,
};

const { src, dest } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  scss = require("gulp-sass"),
  autoprefixer = require("gulp-autoprefixer"),
  groupMedia = require("gulp-group-css-media-queries"),
  cleanCss = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  uglify = require("gulp-uglify-es").default,
  babel = require("gulp-babel"),
  imagemin = require("gulp-imagemin"),
  webp = require("gulp-webp"),
  sprite = require("gulp-svg-sprite"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  ttf2woff = require("gulp-ttf2woff"),
  fonter = require("gulp-fonter"),
  webpcss = require("gulp-webpcss"),
  webphtml = require("gulp-webp-html");

function browserSync() {
  browsersync.init({
    server: {
      baseDir: `./${projectFolder}/`,
    },
    port: 666,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())

    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded",
      })
    )
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        browsers: ["last 5 versions"],
      })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.images)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.images))
    .pipe(src(path.src.favicon))
    .pipe(dest(path.build.favicon))
    .pipe(src(path.src.images))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [
          {
            removeViewBox: false,
          },
        ],
        interlaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(dest(path.build.images))
    .pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

function otf2ttf() {
  return src([`${sourceFolder}/fonts/*.otf`])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(`${sourceFolder}/fonts/`));
}

function svgSprite() {
  return gulp
    .src([`${sourceFolder}/images/iconsprite/*.svg`])
    .pipe(
      sprite({
        mode: {
          stack: {
            sprite: "../icons.svg",
            example: false,
          },
        },
      })
    )
    .pipe(dest(path.build.images));
}

function fontsStyle() {
  let file_content = fs.readFileSync(`${sourceFolder}/scss/_fonts.scss`);
  if (file_content == "") {
    fs.writeFile(`${sourceFolder}/scss/_fonts.scss`, "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              `${sourceFolder}/scss/_fonts.scss`,
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
            // fs.appendFile(`${sourceFolder}/scss/_fonts.scss`, `@include font("${fontname}","${fontname}",400,normal);\r\n`, cb);
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.images], images);
}

function clean() {
  return del(path.clean);
}

let build = gulp.series(
  clean,
  gulp.parallel(html, css, js, images, fonts),
  fontsStyle,
  otf2ttf,
  svgSprite
);
let watch = gulp.parallel(build, browserSync, watchFiles);

exports.otf2ttf = otf2ttf;
exports.svgSprite = svgSprite;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
