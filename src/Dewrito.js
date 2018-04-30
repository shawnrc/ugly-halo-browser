// Implementation of our basic Dewrito interface using the in-game server
// browser API.
class InGameDewrito {
	constructor() {}

	ExitBrowserButton = function() {
		return (<button style={{display:'block'}} onClick={() => {
				window.dew.hide();
		}}>Exit browser</button>);
	}

	// Exits the server browser, triggering any tear-down callbacks.
	exit() { window.dew.hide(); }

	// Registers callbacks for when the server browser is paged in or out.
	onExit(cb) { window.dew.on('hide', cb); }
	onLoad(cb) { window.dew.on('show', cb); }
}

// Implementation of our basic Dewrito interface using the remote-console
// Websocket API.
class RemoteDewrito {
	constructor() {}

	ExitBrowserButton = function() { return null; }

	// Lifecycle not relevant when we're running in an external browser.
	exit() {}
	onExit() {}
	onLoad() {}
}

var Dewrito;
if (window.dew) {
	window.dew.on('show', function() {
		// Page out the main menu.
		window.dew.command('Game.HideH3UI 1');
	});
	window.dew.on('hide', function() {
		// When we're done, page it back in.
		window.dew.command('Game.HideH3UI 0');
	});
	
	Dewrito = InGameDewrito;
} else {
	Dewrito = RemoteDewrito;
}

export default Dewrito;
