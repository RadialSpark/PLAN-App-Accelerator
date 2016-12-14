var gulp = require( 'gulp' );
var ts = require( 'gulp-typescript' );
var less = require( 'gulp-less' );

gulp.task( 'less', function () {
	return gulp.src( 'client/stylesheets/*.less' )
		.pipe( less() )
		.pipe( gulp.dest( 'client/stylesheets/compiled' ) );
} );

gulp.task( 'typescript', function () {
	return gulp.src( 'client/javascripts/**/*.ts' )
		.pipe( ts( {
			"target": "es5",
			"module": "system",
			"moduleResolution": "node",
			"emitDecoratorMetadata": true,
			"experimentalDecorators": true,
			"removeComments": false,
			"noImplicitAny": false,
			"outDir": "./client/javascripts/compiled/"
		} ) )
		.pipe( gulp.dest( 'client/javascripts/compiled' ) );
} );

gulp.task( 'watch', [ 'typescript', 'less' ], function () {
	gulp.watch( 'client/javascripts/**/*.ts', [ 'typescript' ] );
	gulp.watch( 'client/stylesheets/*.less', [ 'less' ] );
} );

gulp.task( 'default', [ 'typescript', 'less' ], function () {} );
