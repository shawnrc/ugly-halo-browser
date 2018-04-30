require('normalize.css/normalize.css');
require('styles/App.css');

import * as Filters from './Filters.js'
import React from 'react';
import SortableHeadings from './Heading.js'
import Dewrito from '../Dewrito.js'

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

class AppComponent extends React.Component {
  constructor(props) {
		super(props);
		this.dewrito = new Dewrito()
		this.state = {
			reloadsStarted: 0,
			reloadsFinished: 0,
	
			filters: {
				loaded: {
					matchesFilter: (server) => !!server.loaded,
					enabled: () => true,
					invertSelection: false
				},
				full: new Filters.FullFilter(false),
				empty: new Filters.EmptyFilter(true),
				dedicated: new Filters.DedicatedServerFilter(false),
				noprivate: new Filters.PrivateFilter(true),
			  variant: new Filters.SearchFilter('variant', 'Game Variant'),
				map: new Filters.SearchFilter('map', 'Map'),
				nameSearch: new Filters.SearchFilter('name', 'Server Name'),
				maxServerSize: new Filters.ThresholdFilter(
					'maxPlayers', 'Max server size', Filters.ThresholdFilter.MAX),
				minServerSize: new Filters.ThresholdFilter(
					'maxPlayers', 'Min server size', Filters.ThresholdFilter.MIN)
			},
			servers: {},
	
			sortProp: '',
			sortInvert: -1
		};

		// Bound methods, for use as callbacks.
		this.reload = this.reload.bind(this);
		this.setSort = this.setSort.bind(this);
		this.onSearchUpdate = this.onSearchUpdate.bind(this);
		this.onToggleUpdate = this.onToggleUpdate.bind(this);
		this.onInvertUpdate = this.onInvertUpdate.bind(this);
		this.onCaseUpdate = this.onCaseUpdate.bind(this);
		this.onThresholdUpdate = this.onThresholdUpdate.bind(this);

		// Lifecycle
		this.dewrito.onExit(function() {
			this.setState({servers: {}});
		}.bind(this));
		this.dewrito.onLoad(this.reload);
  }

	componentDidMount() {
		this.reload();
	}

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
					setTimeout(
						() =>
						  this.setState(
								{reloadsFinished: this.state.reloadsFinished + 1}),
						500)
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

	startFetch(ip) {
		return fetch('http://' + ip)
			.then(resp => resp.json())
			.then(
				this.processResponse.bind(this, ip));
	}

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
	}

	shouldRender(server, filters) {
		for (var filter of filters) {
			if (!filter.matchesFilter(server)) {
				return false;
			}
		}
		return true;
	}

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
	}

	setSort(sortProp, e) {
		e.preventDefault();
		var sortChanged = sortProp != this.state.sortProp;
		this.setState({
			sortProp: sortProp,
			sortInvert: sortChanged ?
			    -1 : -1 * this.state.sortInvert
		});
	}

	onSearchUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].searchTerm = event.target.value;
		this.setState(new_state);
	}

	onToggleUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].engaged = event.target.checked;
		this.setState(new_state);
	}

	onInvertUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].invertSelection = event.target.checked;
		this.setState(new_state);
	}

	onCaseUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		new_state.filters[filter].caseSensitive = event.target.checked;
		this.setState(new_state);
	}

	onThresholdUpdate(filter, event) {
		var new_state = { filters: this.state.filters };
		const maybe_threshold = parseInt(event.target.value);
		new_state.filters[filter].threshold =
			isNaN(maybe_threshold) ? 0 : maybe_threshold;
		this.setState(new_state);
	}

  render() {
		const searchSelectors = Object.entries(this.state.filters)
			.filter((column) => column[1] instanceof Filters.SearchFilter)
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
		  .filter(column => column[1] instanceof Filters.ToggleFilter)
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
		  .filter(column => column[1] instanceof Filters.ThresholdFilter)
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
			<this.dewrito.ExitBrowserButton />
			<table><tbody>{ searchSelectors }{ thresholds }</tbody></table>
			<div>{ flags }</div>
			<button onClick={this.reload}>Reload</button>
		  <table id='servers'><tbody>
			  <tr>
				  <th>IP</th>
			  <SortableHeadings
			    headers={{
						'name': 'Name',
						'map': 'Map',
						'variant': 'Game Variant',
						'numPlayers': 'Players'
					}}
					current={this.state.sortProp}
			    dir={this.state.sortInvert}
			    callback={this.setSort} />
			  </tr>
			  { servers }
			</tbody></table>
			</div>
		);
  }
}

export default AppComponent;
