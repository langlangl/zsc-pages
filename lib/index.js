const {src,dest,parallel,series,watch} = require('gulp')
// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require("gulp-imagemin")
const browserSync = require('browser-sync')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const del = require('del')

const bs = browserSync.create()
const cwd = process.cwd()

let config = {
  //default
  
}
try {
 const  loadcConfig = require(`${cwd}/pages.config.js`)
 config = Object.assign({},config,loadcConfig)
} catch (error) {
  
}
const clean = ()=>{
    return del([config.build.dist,config.build.temp])
}
const style  = ()=>{
    return src(config.build.paths.styles,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.sass())
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream : true}))
}

const script = ()=>{
    return src(config.build.paths.scripts,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream : true}))
}

const page = ()=>{
    return src(config.build.paths.pages,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.swig({ data:config.data }))
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream : true}))
}
const image = ()=>{
    return src(config.build.paths.images,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
const font = ()=>{
    return src(config.build.paths.fonts,{base:config.build.src,cwd:config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () =>{
    return src('**',{ base : config.build.public ,cwd:config.build.src})
    .pipe(dest(config.build.dist))
}

const useref = ()=>{
    return src(config.build.paths.pages,{base:config.build.temp,cwd:config.build.temp})
    .pipe(plugins.useref({searchPath:[config.build.temp,'.']}))
    .pipe(plugins.if(/\.js$/,plugins.uglify()))
    .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/,plugins.htmlmin({
        collapseWhitespace:true,
        minifyCSS:true,
        minifyJS:true
    })))
    .pipe(dest(config.build.dist))
}
const serve = ()=>{
    watch(config.build.paths.styles,{cwd:config.build.src},style)
    watch(config.build.paths.scripts,{cwd:config.build.src},script)
    watch(config.build.paths.pages,{cwd:config.build.src},page)
    // watch('src/assets/images/**',image)
    // watch('src/assets/fonts/**',font)
    // watch('public/**',extra)
    watch([
      config.build.paths.images,
      config.build.paths.fonts
    ],{cwd:config.build.src},bs.reload)

    watch("**",{cwd:config.build.public},bs.reload)
    bs.init({
        notify:false,
        port:2000,
        // open:false,
        // files:'dist/**',
        server:{
            baseDir:[config.build.temp,config.build.src,config.build.public],
            routes:{
                "/node_modules":"node_modules"
            }
        }
    })
}
const compile = parallel(style,script,page)
const build =  series(clean ,parallel(series(compile,useref),extra,image,font))
 const develop = series(compile,serve)

module.exports = {
    clean,
    build,
    develop,
}