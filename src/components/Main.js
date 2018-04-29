require('normalize.css/normalize.css');
require('styles/App.css');

import React from 'react';

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

function NumberSelector(props) {
	return (
		<input
		  type="number"
		  id={props.id}
		  min={props.min}
			value={props.value}
			onChange={function (e) { props.onChange(props.id, e) }}
		/>);
}

function SearchFilterInputs(props) {
	return (
    <tr>
	    <td>{props.filter.title}: </td>
	    <td>
		   <input type="text"
	 	     placeholder={'Search by ' + props.filter.title}
	 	     value={props.filter.searchTerm}
	 	     onChange={function (e) { props.onSearchTermChange(props.id, e) }}
	 	   />
	    </td>
	    <td>
			  <label htmlFor={'toggle-invert-' + props.id}>Invert selection</label>
    	  <input
	  	    id={'toggle-invert-' + props.id}
	  	    type="checkbox"
			    checked={props.filter.invertSelection}
					onChange={function (e) { props.onInvertChange(props.id, e) }}
	  	  />
	    </td>
	    <td>
		   <label htmlFor={'case-sensitive-' + props.id}>Case sensitive</label>
   	   <input
	 	     id={'case-sensitive-' + props.id}
	 	     type="checkbox"
	 	     checked={props.filter.caseSensitive}
	 	     onChange={function (e) { props.onCaseSensitivityChange(props.id, e) }}
	 	   />
	    </td>
	  </tr>);
}

function Server(props) {
	const server = props.server;
	return(
		<tr>
		  <td>{ server.ip }</td>
		  <td>{ server.name }</td>
		  <td>{ server.map }</td>
		  <td>{ server.variant }</td>
		  <td>{ server.numPlayers + '/' + server.maxPlayers }</td>
  	</tr>);
}

function SortArrow(props) {
	if (props.target != props.actual) return null;
	if (props.dir == -1) return (<span>{String.fromCharCode(8659)}</span>);
	else return (<span>{String.fromCharCode(8657)}</span>);
}

var SortableHeading = React.createClass({
	shouldComponentUpdate(nextProps) {
		if (this.props.actual != this.props.target && nextProps.actual != nextProps.target) {
			return false;
		}
		return true;
	},

	render() {
		return (
			<th onClick={function (e) { this.props.callback(this.props.target, e) }.bind(this) }>
			  {this.props.children}
				<SortArrow
			    target={this.props.target}
					actual={this.props.actual}
					dir={this.props.dir} />
		  </th>);
	}
})

var AppComponent = React.createClass({
  getInitialState() {
		return {
			reloadsStarted: 0,
			reloadsFinished: 0,
	
			filters: {
				loaded: {
					matchesFilter: (server) => !!server.loaded,
					enabled: () => true,
					invertSelection: false
				},
				full: new FullFilter(false),
				empty: new EmptyFilter(true),
				dedicated: new DedicatedServerFilter(false),
				noprivate: new PrivateFilter(true),
			  variant: new SearchFilter('variant', 'Game Variant'),
				map: new SearchFilter('map', 'Map'),
				nameSearch: new SearchFilter('name', 'Server Name'),
				maxServerSize: new ThresholdFilter('maxPlayers', 'Max server size', ThresholdFilter.MAX),
				minServerSize: new ThresholdFilter('maxPlayers', 'Min server size', ThresholdFilter.MIN)
			},
			servers: {},
	
			sortProp: '',
			sortInvert: -1
		};
  },

	componentDidMount() {
		this.reload();
	},

	reload() {
		if (this.state.reloadsStarted > this.state.reloadsFinished) return;

		this.setState({reloadsStarted: this.state.reloadsStarted + 1, servers: {}});
		fetch('http://158.69.166.144:8080/list')
		  .then(res => res.json())
			.then(
				(res) => {
					var new_servers = {};
					res.result.servers.map(s => new_servers[s] = {
						ip: s,
						variant: '',
						name: '',
						loaded: false
					});
					this.setState({servers: new_servers});
					setTimeout(() => this.setState({reloadsFinished: this.state.reloadsFinished + 1}), 500)
					for (const [ip, server] of Object.entries(this.state.servers)) {
						server.fetch = server.fetch || this.startFetch(ip);
					}
				});
		fetch('http://new.halostats.click/api/officialservers')
		  .then(res => res.json())
		  .then(
				(res) => {
					this.setState({officialServers: res.map(s => s.address)});
				});
	},

	startFetch(ip) {
		return fetch('http://' + ip)
			.then(resp => resp.json())
			.then(
				this.processResponse.bind(this, ip));
	},

	processResponse(ip, response) {
		if (!this.state.servers.hasOwnProperty(ip)) {
			return;
		}

	  var update = {servers: this.state.servers};
		var server = update.servers[ip];
		Object.assign(server, response);
		server.numPlayers = parseInt(server.numPlayers)
		server.maxPlayers = parseInt(server.maxPlayers)
		server.loaded = true;
	  this.setState(update);
	},

	shouldRender(server, filters) {
		for (var filter of filters) {
			if (!filter.matchesFilter(server)) {
				return false;
			}
		}
		return true;
	},

	setSort(sortProp, e) {
		e.preventDefault();
		var sortChanged = sortProp != this.state.sortProp;
		this.setState({
			sortProp: sortProp,
			sortInvert: sortChanged ?
			    -1 : -1 * this.state.sortInvert
		});
	},

	compareFn(lhs, rhs) {
		const {sortProp, sortInvert} = this.state;
		if (!sortProp) return 0;

		if (lhs[sortProp].toLowerCase) {
			const lhsLower = lhs[sortProp].toLowerCase();
			const rhsLower = rhs[sortProp].toLowerCase();

		  if (lhsLower < rhsLower) return -1 * sortInvert;
		  else if (lhsLower > rhsLower) return sortInvert;
			else return 0;
		} else {
		  if (lhs[sortProp] < rhs[sortProp]) return -1 * sortInvert;
		  else if (lhs[sortProp] > rhs[sortProp]) return sortInvert;
			else return 0;
		}
	},

	onSearchUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].searchTerm = event.target.value;
		this.setState(new_state);
	},

	onToggleUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].engaged = event.target.checked;
		this.setState(new_state);
	},

	onInvertUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].invertSelection = event.target.checked;
		this.setState(new_state);
	},

	onCaseUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].caseSensitive = event.target.checked;
		this.setState(new_state);
	},

	onThresholdUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		const maybe_threshold = parseInt(event.target.value);
		new_state.filters[filter].threshold =
			isNaN(maybe_threshold) ? 0 : maybe_threshold;
		this.setState(new_state);
	},

  render() {
		const searchSelectors = Object.entries(this.state.filters)
			.filter((column) => column[1] instanceof SearchFilter)
			.map(
				(column) =>
				  <SearchFilterInputs
				    key={column[0]}
				    id={column[0]}
				    filter={column[1]}
				    onSearchTermChange={this.onSearchUpdate}
				    onInvertChange={this.onInvertUpdate}
				    onCaseSensitivityChange={this.onCaseUpdate}
				  />);
		const flags = Object.entries(this.state.filters)
		  .filter(column => column[1] instanceof ToggleFilter)
		  .map(
				(column) =>
				  <div key={column[0]}>
				    <label htmlFor={'toggle-filter-' + column[0]}>{column[1].name}</label>
  				  <input type="checkbox"
				      id={'toggle-filter-' + column[0]}
					    checked={column[1].engaged}
					    onChange={this.onToggleUpdate.bind(this, column[0])}
					  />
				    <br />
			    </div>);
		const thresholds = Object.entries(this.state.filters)
		  .filter(column => column[1] instanceof ThresholdFilter)
		  .map(
				(column) =>
				  <tr key={column[0]}>
				    <td>{column[1].title}: </td>
				    <td>
				      <NumberSelector
				        id={column[0]}
				        value={column[1].threshold}
				        min="0"
				        onChange={this.onThresholdUpdate} />
						</td>
				  </tr>);

		const activeFilters = Object.values(this.state.filters)
		  .filter(filter => filter.enabled());
		const servers = Object.entries(this.state.servers)
			.filter(server => this.shouldRender(server[1], activeFilters))
		  .sort((lhs, rhs) =>	this.compareFn(lhs[1], rhs[1]))
			.map((server) =>
				<Server key={server[0]} server={server[1]} />);
		const totalPlayers = Object.values(this.state.servers)
		  .reduce(
				((acc, s) => 
				  s.loaded && !isNaN(s.numPlayers)
				    ? acc + s.numPlayers
			      : acc),
		    0);
			  
    return (
			<div>
			<span>{ totalPlayers } players on { Object.keys(this.state.servers).length } servers</span>
			<table><tbody>{ searchSelectors }{ thresholds }</tbody></table>
			<div>{ flags }</div>
			<button onClick={this.reload}>Reload</button>
		  <table id='servers'><tbody>
			  <tr>
				  <th>IP</th>
			    <SortableHeading
			      target='name'
			      actual={this.state.sortProp}
			      dir={this.state.sortInvert}
			      callback={this.setSort}>
			      Name
			    </SortableHeading>
			    <SortableHeading
			      target='map'
			      actual={this.state.sortProp}
			      dir={this.state.sortInvert}
			      callback={this.setSort}>
			      Map
			    </SortableHeading>
			    <SortableHeading
			      target='variant'
			      actual={this.state.sortProp}
			      dir={this.state.sortInvert}
			      callback={this.setSort}>
			      Game Variant
			    </SortableHeading>
			    <SortableHeading
			      target='numPlayers'
			      actual={this.state.sortProp}
			      dir={this.state.sortInvert}
			      callback={this.setSort}>
			      Players
			    </SortableHeading>
			  </tr>
			  { servers }
			</tbody></table>
			</div>
		);
  }
})

export default AppComponent;
