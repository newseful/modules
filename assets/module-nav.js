var modulenav = document.createElement('div');
modulenav.classList.add('newseful-module-nav');
var title = document.createElement('h1');

var backURL = window.location.pathname.split('/');
backURL.pop();
backURL.pop();
backURL = backURL.length > 1 ? backURL.join('/') : '/';

var backLink = document.createElement('a');
backLink.setAttribute('href', backURL);
backLink.innerHTML = '\u2190';
title.appendChild(backLink);

var list = document.createElement('ul');

var moduleRoutes = [
{
	name : 'Annotation Helper',
	slug : '/annotation_helper/',
},
{
	name : 'Fact Tracker',
	slug: '/fact_tracker/'
},
{
	name : 'Timeline',
	slug : '/timeline/'
}
]

var currentModule;

var urlForSlug = function(s) {
	return backURL + s + 'index.html';
}

moduleRoutes.map(function(m){

	if (window.location.pathname.match(m.slug)) {
		currentModule = m;
		title.innerHTML += 'Modules: '+ m.name;
	}

	var li = document.createElement('li');

	if (currentModule === m)
		li.classList.add('current');

	var a = document.createElement('a');
	a.setAttribute('href', urlForSlug(m.slug))
	a.innerHTML = m.name;

	li.appendChild(a);
	list.appendChild(li);

});

modulenav.appendChild(title);
modulenav.appendChild(list);

document.body.insertBefore(modulenav, document.body.firstChild);