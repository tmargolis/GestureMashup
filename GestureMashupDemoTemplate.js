/*global require, alert*/
/*
 * 
 * @owner Enter you name here (xxx)
 */
/*
 *    Fill in host and port for QlikView engine
 */
var config = {
	host: window.location.hostname,
	prefix: "/",
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
require.config( {
	baseUrl: ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "resources",
	paths: {
		"mashupModules": ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "extensions" + config.prefix + "SummitMashup"
	}
} );

require( ["js/qlik"], function ( qlik ) {
	qlik.setOnError( function ( error ) {
		alert( error.message );
	} );

	//callbacks -- inserted here --
	//open apps -- inserted here --
	var app = qlik.openApp('Gestural Device Demo App.qvf', config);

	//get objects -- inserted here --
	app.getObject('templateDiv','b3171868-d335-49c8-997a-1337ffbaa56e');
	

	app.getObject('CurrentSelections','CurrentSelections');
	
	//create cubes and lists -- inserted here --

} );
