;(function (global) {

	// map tells the System loader where to look for things
	var map = {
		'app': '/javascripts/compiled/', // 'dist',
		'rxjs': '/rxjs',
		'@angular': '/@angular',
		'ng2-bootstrap': '/ng2-bootstrap',
		'ng2-scrollspy': '/ng2-scrollspy',
		'immutable': '/immutable/dist'
	};

	// packages tells the System loader how to load when no filename and/or no extension
	var packages = {
		'app': { main: 'main.js', defaultExtension: 'js' },
		'rxjs': { defaultExtension: 'js' },
		'ng2-bootstrap': { main: 'ng2-bootstrap', defaultExtension: 'js' },
		'immutable': { main: 'immutable', defaultExtension: 'js' }
	};

	var packageNames = [
		'@angular/common',
		'@angular/compiler',
		'@angular/core',
		'@angular/http',
		'@angular/platform-browser',
		'@angular/platform-browser-dynamic',
		'@angular/router',
		'ng2-scrollspy'
	];

	// add package entries for angular packages in the form '@angular/common': { main: 'index.js', defaultExtension: 'js' }
	packageNames.forEach(function (pkgName) {
		packages[pkgName] = { main: 'index.js', defaultExtension: 'js' };
	});

	var config = {
		map: map,
		packages: packages
	};

	// filterSystemConfig - index.html's chance to modify config before we register it.
	if (global.filterSystemConfig) { global.filterSystemConfig(config); }

	System.config(config);

})(this);
