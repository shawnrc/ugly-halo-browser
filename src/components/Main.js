require('normalize.css/normalize.css');
require('styles/App.css');
require('react-select/dist/react-select.css')

import React from 'react';
import Select from 'react-select';
//import ServerList from './ServerList';

class CategoricalFilter {
	isTransient = true;

	constructor(title, field) {
		this.title = title;
		this.field = field;
		this.allValues = [];
		this.filterValues = [];
		this.invertSelection = false;
  }

	get options() {
		return Object.entries(this.allValues).
			filter((entry) => entry[1] > 0).
			map((entry) => ({
				value: entry[0],
				label: entry[0]
			}));
	}

  matchesFilter = (server) =>
    (this.filterValues.length == 0) ||
      !!this.filterValues.find((el) => el.value == server[this.field])
}

class SearchFilter {
	isTransient = false;

	constructor(field, title) {
		this.title = title
		this.field = field
  	this.searchTerm = '';
  	this.invertSelection = false;
  }

  matchesFilter = (server) =>
    (this.searchTerm.length == 0) ||
      server[this.field].toLowerCase().includes(this.searchTerm)
}

class ThresholdFilter {
	isTransient = true;

	constructor() {
		this.thresholdValue = 0;
		this.rawText = '';
	}

	matchesFilter = (server) => {
		return (this.thresholdValue == 0) ||
			(server.ping <= this.thresholdValue)
	}
}

class ToggleFilter {
}

class FullFilter extends ToggleFilter {
	name = 'Hide full'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		!this.engaged || (server.numPlayers < server.maxPlayers)
}

class PrivateFilter extends ToggleFilter {
	name = 'Hide passworded'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		!this.engaged || !server.passworded
}

class EmptyFilter extends ToggleFilter {
	name = 'Hide empty'

	constructor(engaged) {
		super();
		this.engaged = engaged
	}

	matchesFilter = (server) =>
		!this.engaged || (server.numPlayers > 0)
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

function Server(props) {
	const server = props.server;
	return(
		<tr>
		  <td>{ server.ip }</td>
		  <td>{ server.name }</td>
		  <td>{ server.ping }</td>
		  <td>{ server.variant }</td>
		  <td>{ server.numPlayers + '/' + server.maxPlayers }</td>
  	</tr>);
}

function SortArrow(props) {
	if (props.target != props.actual) return null;
	if (props.dir == -1) return (<span>{String.fromCharCode(8659)}</span>);
	else return (<span>{String.fromCharCode(8657)}</span>);
}

class AppComponent extends React.Component {
	componentDidMount() {
		this.reload();
	}

	reload() {
		this.setState({servers: {}, numPlayers: 0});
		fetch('http://158.69.166.144:8080/list')
		  .then(res => res.json())
			.then(
				(res) => {
					var new_servers = {};
					res.result.servers.map(s => new_servers[s] = {
						ip: s,
						variant: '',
						name: '',
						ping: null,
						loaded: false
					});
					this.setState({servers: new_servers});
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
	}

	startFetch = (ip) => {
		return fetch('http://' + ip)
			.then(resp => resp.json())
			.then(
				this.processResponse.bind(this, ip));
	}

	processResponse = (ip, response) => {
		if (!this.state.servers.hasOwnProperty(ip)) {
			return;
		}

	  var update = {servers: this.state.servers};
		var server = update.servers[ip];
		Object.assign(server, response);
		server.numPlayers = parseInt(server.numPlayers)
		update.totalPlayers = this.state.totalPlayers + server.numPlayers
		server.maxPlayers = parseInt(server.maxPlayers)
		server.loaded = true;
	  this.setState(update);
	}

  state = {
		filters: {
			loaded: {
				matchesFilter: (server) => !!server.loaded,
				invertSelection: false
			},
			full: new FullFilter(false),
			empty: new EmptyFilter(true),
			dedicated: new DedicatedServerFilter(false),
			noprivate: new PrivateFilter(true),
		  variant: new SearchFilter('variant', 'Game Variant'),
			nameSearch: new SearchFilter('name', 'Server Name'),
			pingThreshold: new ThresholdFilter()
		},
		totalPlayers: 0,
		servers: {},

		sortProp: '',
		sortInvert: -1
  }

	shouldRender = (server) => {
		for (var column of Object.values(this.state.filters)) {
			if (!column.matchesFilter(server) && !column.invertSelection) {
				return false;
			}
		}
		return true;
	}

	setSort = (sortProp, e) => {
		e.preventDefault();
		var sortChanged = sortProp != this.state.sortProp;
		this.setState({
			sortProp: sortProp,
			sortInvert: sortChanged ?
			    -1 : -1 * this.state.sortInvert
		});
	}

	compareFn = (lhs, rhs) => {
		const {sortProp, sortInvert} = this.state;
		if (!sortProp) return 0;
		if (lhs[sortProp] < rhs[sortProp]) return -1 * sortInvert;
		else if (lhs[sortProp] > rhs[sortProp]) return sortInvert;
		else return 0;
	}

  onNewFiltersSelected =
      (column, selectedFilters) => {
				var new_state = { filters: this.state.filters };
				Object.assign(new_state.filters[column], {
					filterValues: selectedFilters
				});
        this.setState(new_state)
      }

	onSearchUpdate =
		(filter, event) => {
			console.log(filter);
			var new_state = Object.assign({ filters: this.state.filters });
			Object.assign(new_state.filters[filter], {
				searchTerm: event.target.value
			});
			this.setState(new_state);
		}

	onToggleUpdate =
		(filter, event) => {
			var new_state = Object.assign({ filters: this.state.filters });
			Object.assign(new_state.filters[filter], {
				engaged: event.target.checked
			});
			this.setState(new_state);
		}

	onPingThresholdUpdate =
		(event) => {
			var parsed = parseInt(event.target.value, 10);
			if (event.target.value.length > 0 && isNaN(parsed)) return;

			var new_state = Object.assign({}, { filters: this.state.filters });
			Object.assign(new_state.filters.pingThreshold, {
				rawText: event.target.value,
				thresholdValue: parseInt(event.target.value, 10) || 0
			});
  		this.setState(new_state);
		}

  render() {
		const columnSelectors = Object.entries(this.state.filters).
			filter((column) => column[1] instanceof CategoricalFilter).
			map(
		  	(column) =>
 		  	  <Select
		  	    key = { column[0] }
       	    placeholder = {'Select ' + column[1].title + 's' }
       	    closeOnSelect= { false }
       	    multi
       	    onChange = { this.onNewFiltersSelected.bind(this, column[0]) }
       	    options = { column[1].options }
       	    value = { column[1].filterValues }
		  	  />
		  	);
		const searchSelectors = Object.entries(this.state.filters)
			.filter((column) => column[1] instanceof SearchFilter)
			.map(
				(column) =>
				  <input type="text"
				    key={column[0]}
				    placeholder={'Search by ' + column[1].title}
				    value={column[1].searchTerm}
				    onChange={this.onSearchUpdate.bind(this, column[0])}
				  />);
		const flags = Object.entries(this.state.filters)
		  .filter(column => column[1] instanceof ToggleFilter)
		  .map(
				(column) =>
				  <span key={column[0]}>
				    <label>{column[1].name}</label>
  				  <input type="checkbox"
					    key={column[0]}
					    label={column[1].name}
					    checked={column[1].engaged}
					    onChange={this.onToggleUpdate.bind(this, column[0])}
					  />
			    </span>);
		const servers = Object.entries(this.state.servers)
			.filter(server => this.shouldRender(server[1]))
		  .sort((lhs, rhs) =>	this.compareFn(lhs[1], rhs[1]))
			.map((server) =>
				<Server key={server[0]} server={server[1]} />);
			  
    return (
			<div>
			<span>{ this.state.totalPlayers } players on { Object.keys(this.state.servers).length } servers</span>
			<div>{ columnSelectors }</div>
			<div>{ searchSelectors }</div>
			<div>{ flags }</div>
			<button onClick={this.reload.bind(this)}>Reload</button>
		  <table id='servers'><tbody>
			  <tr>
				  <th>IP</th>
			 	  <th>Name</th>
			 	  <th>Ping</th>
			 	  <th onClick={this.setSort.bind(this, 'variant')}>
			      Game Type
			      <SortArrow target='variant' actual={this.state.sortProp} dir={this.state.sortInvert} />
			    </th>
			 	  <th onClick={this.setSort.bind(this, 'numPlayers')}>
			      Players
			      <SortArrow target='numPlayers' actual={this.state.sortProp} dir={this.state.sortInvert} />
			    </th>
			  </tr>
			  { servers }
			</tbody></table>
			</div>
		);
  }
}

export default AppComponent;
