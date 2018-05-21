// ...children 是为了将后面 chilren1, children2 等参数合并为一个数组

function createElement(tag, attrs, ...children) {
	return {
		tag,
		attrs,
		children,
	}
}

function render(vnode, container) {
	if (typeof vnode === 'string') {
		const textNode = document.createTextNode(vnode);
		return container.appendChild(textNode);
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


	return container.appendChild(dom);
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


const React = {
	createElement,
}

const ReactDom = {
	render: (vnode, container) => {
		container.innerHTML = '';
		return render(vnode, container);
	}
}

