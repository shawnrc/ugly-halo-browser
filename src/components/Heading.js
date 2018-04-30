import React from 'react';

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

export default SortableHeading;
