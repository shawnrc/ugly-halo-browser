class ThresholdFilter {
	constructor(field, title, op) {
		this.title = title
		this.field = field
		this.threshold = 0
		this.op = op
		console.log(this.title, this.field, this.op)
	}

	enabled = () => this.threshold > 0

	matchesFilter = (server) => {
		switch (this.op) {
			case ThresholdFilter.MIN:
				return server[this.field] >= this.threshold;
			case ThresholdFilter.MAX:
				return server[this.field] <= this.threshold;
		}
	}
}

class SearchFilter {
	isTransient = false;

	constructor(field, title) {
		this.title = title
		this.field = field
  	this.searchTerm = '';
  	this.invertSelection = false;
		this.caseSensitive = false;
  }

	enabled = () => this.searchTerm.length != 0

  matchesFilter = (server) =>
		this.caseSensitive ?
      server[this.field].includes(this.searchTerm) != this.invertSelection
      : server[this.field].toLowerCase().includes(this.searchTerm.toLowerCase())
			  != this.invertSelection
}
ThresholdFilter.MIN = 0
ThresholdFilter.MAX = 1

class ToggleFilter {
	enabled = () => this.engaged
}

class FullFilter extends ToggleFilter {
	name = 'Hide full'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		(server.numPlayers < server.maxPlayers)
}

class PrivateFilter extends ToggleFilter {
	name = 'Hide passworded'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		!server.passworded
}

class EmptyFilter extends ToggleFilter {
	name = 'Hide empty'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		(server.numPlayers > 0)
}

class DedicatedServerFilter extends ToggleFilter {
	name = 'Show dedicated servers only'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		!this.engaged || !!server.isDedicated
}

export {
	ThresholdFilter,
	ToggleFilter,
	SearchFilter,
	PrivateFilter,
	FullFilter,
	EmptyFilter,
	DedicatedServerFilter
};
