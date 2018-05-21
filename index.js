
// ReactDom.render(
// 	<h2>Hello, world</h2>,
// 	document.getElementById('root')
// )

function tick() {
	const element = (
		<div>
			<h1>Hello, world</h1>
			<h2>It is {new Date().toLocaleTimeString()}.</h2>
		</div>
	);
	ReactDom.render(
		element,
		document.getElementById('root'),
	)
}

setInterval(tick, 1000);







