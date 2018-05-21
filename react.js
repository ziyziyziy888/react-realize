// ...children 是为了将后面 chilren1, children2 等参数合并为一个数组

function createElement(tag, attrs, ...children) {
	return {
		tag,
		attrs,
		children,
	}
}

function render(vnode, container) {
	return container.appendChild(_render(vnode));
}

function _render(vnode) {
	if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = '';
	if (typeof vnode === 'number') vnode = String(vnode);

	if (typeof vnode === 'string') {
		const textNode = document.createTextNode(vnode);
		return textNode;
	}

	if (typeof vnode.tag === 'function') {
		const component = createComponent(vnode.tag, vnode.attrs);
		setComponentProps(component, vnode.attrs);
		return component.base;
	}

	const dom = document.createElement(vnode.tag);

	if (vnode.attrs) {
		Object.keys(vnode.attrs).forEach(key => {
			const value = vnode.attrs[key];
			setAttribute(dom, key, value);
		});
	}
// 递归渲染子节点
	vnode.children.forEach(child => render(child, dom));
	return dom;
}

function setAttribute(dom, name, value) {
	if (name === 'className') name = 'class';

	if (/on\w/.test(name)) {
		name = name.toLowerCase();
		dom[name] = value || '';
	} else if (name === 'style') {
		if (!value || typeof value === 'string') {
			dom.style.cssText = value || '';
		} else if (value && typeof value === 'object') {
			for (let styleName in value) {
				dom.style[styleName] = typeof value[styleName] === 'number' ? value[styleName] + 'px' : value[styleName];
			}
		}
	} else {
		if (name in dom) {
			dom[name] = value || '';
		}
		if (value) {
			dom.setAttribute(name, value);
		} else {
			dom.removeAttribute(name, value);
		}
	}
}

function createComponent(component, props) {
	let instance;

// 如果是类定义组件， 则直接返回实例， 否则先将其扩展为类定义组件
	if (component.prototype && component.prototype.render) {
		instance = new component(props);
	} else {
		instance = new Component(props);
		instance.constructor = component;
		instance.render = function() {
			return this.constructor(props);
		}
	}

	return instance;
}


function setComponentProps(component, props) {
	if (!component.base) {
		if (component.componentWillMount) component.componentWillMount();
	} else if (component.componentWillReceiveProps) {
			component.componentWillReceiveProps(props);
	}

	component.props = props;

	renderComponent(component);
}


function renderComponent(component) {
	let base;
	const renderer = component.render();

	if (component.base && component.componentWillUpdate) {
		component.componentWillUpdate();
	}

	base = _render(renderer);

	if (component.base) {
		if (component.componentDidUpdate) component.componentDidUpdate();
	} else if (component.componentDidMount) {
		component.componentDidMount();
	}

	if (component.base && component.base.parentNode) {
		component.base.parentNode.replaceChild(base, component.base);
	}

	component.base = base;
	base._component = component;
}


class Component {
	constructor(props = {}) {
		this.state = {};
		this.props = props;
	}

// 暂时不去实现异步的setState
	setState(stateChange) {
		Object.assign(this.state, stateChange);
		renderComponent(this);
	}
}


const React = {
	createElement,
}

const ReactDom = {
	render: (vnode, container) => {
		container.innerHTML = '';
		return render(vnode, container);
	}
}


function Welcome(props) {
	return <h1>Hello, {props.name} </h1>
}

function App() {
	return (
		<div>
			<Welcome name="Sara" />
			<Welcome name="Cahal" />
			<Welcome name="Edite" />
		</div>
	)
}

const element = <Welcome name="Sara" />;
const appElement = <App />;


ReactDom.render(
	appElement,
	document.getElementById('root'),
);