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

	// base = _render(renderer);

	base = diffNode(component.base, renderer);


	if (component.base) {
		if (component.componentDidUpdate) component.componentDidUpdate();
	} else if (component.componentDidMount) {
		component.componentDidMount();
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
	Component,
}

const ReactDom = {
	render: (vnode, container) => {
		container.innerHTML = '';
		return render(vnode, container);
	}
}

/**
	* diff(dom, vnode)
	* @param {HTMLElement} dom 真实DOM
	* @param {vnode} vnode 虚拟DOM
	* @returns {HTMLElement} 更新后的DOM
	*
*/

/**
	* 首先可以先回忆一下虚拟DOM的结构
	* 文本、原生节点、 组件
	*	原生DOM
	*	{
	*   tag: 'div',
	*   attrs: {
	*    className: 'container' 
	* 	},
	*   children: []
	*	}
	* 文本
	* "hello, world"
	* 组件的vnode
	* {
	* 	tag: ComponentConstructor,
	*   attrs: {
	*   	className: 'container'
	*		}
	*   children: []
	* }
*/


function diff(dom, vnode, container) {
	const ret = diffNode(dom, vnode);
	if (container && ret.parentNode !== container) {
		container.appendChild(ret);
	}

	return ret;
}

function diffNode(dom, vnode) {

	let out = dom;
	if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = '';

	if (typeof vnode === 'number') vnode = String(vnode);

	if (typeof vnode === 'string') {
// 文本节点		

		if (dom && dom.nodeType === 3) {
			dom.textContent = vnode;
		} else {
			out = document.createTextNode(vnode);
			if (dom && dom.parentNode) {
				dom.parentNode.replaceChild(out, dom);
			}
		}
		return out;
	}

	if (typeof vnode === 'function') {
		return diffComponent(dom, vnode);
	}


// 跨级了
	if (!dom || !isSameNodeType(dom, vnode)) {
		out = document.createElement(vnode.tag);

		if (dom) {
			[...dom.childNodes].map(out.appendChild);

			if (dom.parentNode) {
				dom.parentNode.replaceChild(out, dom);
			}
		}
	}

	if (vnode.children && vnode.children.length > 0 || (out.childNodes && out.childNodes.length > 0)) {
		diffChildren(out, vnode.children);
	}

	diffAttributes(out, vnode);

	return out;
}


function diffChildren(dom, vchildren) {
	const domChildren = dom.childNodes;
	const children = [];

	const keyed = {};

	if (domChildren.length > 0) {
		for (let i = 0; i < domChildren.length; i ++) {
			const child = domChildren[i];
			const key = child.key;

			if (key) {
				keyed[key] = child;
			} else {
				children.push(child);
			}

		}
	}

	if (vchildren && vchildren.length > 0) {
		let min = 0;
		let childrenLen = children.length;

		for (let i = 0; i < vchildren.length; i ++) {
			const vchild = vchildren[i];
			const key = vchild.key;
			let child;

			if (key) {

				if (keyed[key]) {
					child = keyed[key];
					keyed[key] = undefined;
				}
			} else if (min < childrenLen) {

				for (let j = min; j < childrenLen; j ++) {
					let c = children[j];

					if (c && isSameNodeType(c, vchild)) {
						child = c;
						children[j] = undefined;

						if (j === childrenLen - 1) childrenLen --;
						if (j === min) min ++;
					}
				}

			}

			child = diffNode(child, vchild);

			const f = domChildren[i];

			if (child && child !== dom && child !== f) {

				if (!f) {
					dom.appendChild(child);
				} else if (child === f.nextSibling) {
					removeNode(f);
				} else {
					dom.insertBefore(child, f);
				}

			}

		}
	}
}


function diffComponent(dom, vnode) {
	let c = dom && dom._component;
	let oldDom = dom;

	if (c && c.constructor === vnode.tag) {
		setComponentProps(c, vnode.attrs);
		dom = c.base;
	} else {

		if (c) {
			unmountComponent(c);
			oldDom = null;
		}

		c = createComponent(vnode.tag, vnode.attrs);
		setComponentProps(c, vnode.attrs);
		dom = c.base;

		if (oldDom && dom !== oldDom) {
			oldDom._component = null;
			removeNode(oldDom);
		}

		return dom;
	}

}

function diffAttributes(dom, vnode) {
	const old = {};
	const attrs = vnode.attrs;

	for (let i = 0; i < dom.attributes.length; i ++) {
		const attr = dom.attributes[i];
		old[attr.name] = attr.value;
	}

	for (let name in old) {

		if (!(name in attrs)) {
			setAttribute(dom, name, undefined);
		}
	}

	for (let name in attrs) {

		if (old[name] !== attrs[name]) {
			setAttribute(dom, name, attrs[name]);
		}

	}

}


function removeNode(dom) {

	if (dom && dom.parentNode) {
		dom.parentNode.removeChild(dom);
	}

}


function unmountComponent(component) {
	if (component.componentWillUnmount) component.componentWillUnmount();
	removeNode(component.base);
}


function isSameNodeType(dom, vnode) {

	if (typeof vnode === 'string' || typeof vnode === 'number') {
		return dom.nodeType === 3;
	}

	if (typeof vnode.tag === 'string') {
		return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase();
	}

	return dom && dom._component && dom._component.constructor === vnode.tag;
}






class Counter extends React.Component {
    constructor( props ) {
        super( props );
        this.state = {
            num: 1
        }
    }

    onClick() {
        this.setState( { num: this.state.num + 1 } );
    }

    render() {
        return (
            <div>
                <h1>count: { this.state.num }</h1>
                <button onClick={ () => this.onClick()}>add</button>
            </div>
        );
    }
}

ReactDom.render(<Counter />, document.getElementById('root'));




