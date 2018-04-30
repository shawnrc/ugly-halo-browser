import React from 'react';

function SortArrow(props) {
	if (props.target != props.actual) return null;
	if (props.dir == -1) return (<span>{String.fromCharCode(8659)}</span>);
	else return (<span>{String.fromCharCode(8657)}</span>);
}

class SortableHeading extends React.Component {
	constructor(props) {
		super(props);
	}
	shouldComponentUpdate(nextProps) {
		if (this.props.actual != this.props.target && nextProps.actual != nextProps.target) {
			return false;
		}
		return true;
	}

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
}

function SortableHeadings(props) {
	return Object.entries(props.headers)
	  .map((header) =>
			<SortableHeading
			  key={header[0]}
			  target={header[0]}
			  actual={props.current}
			  dir={props.dir}
			  callback={props.callback}>
			  {header[1]}
			</SortableHeading>);
}

export default SortableHeadings;
