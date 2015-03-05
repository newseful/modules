var NFFactCheck = function() {
	this.openingExpression = '[[';
	this.closingExpression = ']]';

	this.facts = [];

	this.reservedKeywords = ['unconfirmed', 'confirmed','false'];

	NodeList.prototype.map = NodeList.prototype.map || Array.prototype.map;

	String.prototype.strip = function() {
		return this.replace('[[', '').replace(']]','')
	}

	String.prototype.prevIndexOf = function(query, index) {
		var sub = this.substr(0, index);
		return sub.lastIndexOf(query);
	}

	String.prototype.nextIndexOf = function(query, index) {
		var sub = this.substr(index);
		return sub.indexOf(query) + index;
	}

	String.prototype.cutExpression = function(open, close) {
		var o = this.indexOf(open);
		var c = this.indexOf(close) + close.length;
		var prev = this.substr(0,o);
		var post = this.substr(c);
		var amended = prev + post;
		return amended.replace(' .', '.');
	}

	String.prototype.stripLeadingSpaces = function() {
		var str = this.substr(0);
		while(str.charAt(0) == ' ') {
			str = str.substr(1);
		}

		return str;
	}

	this.textNodesInSelection = function(el) {
	  var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
	  while(n=walk.nextNode()) a.push(n);
	  return a;
	}

	this.extract = function(node) {
		var text = node.innerHTML;
		if (text !== undefined) {
			var openExpr = text.indexOf(this.openingExpression);
			var closeExpr = text.indexOf(this.closingExpression) + this.closingExpression.length;
			var length = closeExpr - openExpr;
			var _ = this;

			while (openExpr > -1 && closeExpr > -1) {

				var expr = text.substr(openExpr, length);

				var type = (function() {
					var match = _.reservedKeywords.filter(function(k) {
						return k == expr.strip();
					});

					return match[0];
				})();
				

				var sentenceStart = text.prevIndexOf('.', openExpr);
				var sentenceEnd = text.nextIndexOf('.', closeExpr);

				var prev = text.substr(0,text.prevIndexOf('.', sentenceStart));
				var post = text.substr(sentenceEnd + 1);

				var sentence = text.substr(sentenceStart + 1, sentenceEnd - sentenceStart);
				var output = '<span class="newseful-fact-inline ' + type + '">' + sentence.cutExpression(this.openingExpression, this.closingExpression) + '</span>';

				text = prev + output + post;

				this.facts.push({type : type, text : sentence.cutExpression(this.openingExpression, this.closingExpression).stripLeadingSpaces()});

				openExpr = text.indexOf(this.openingExpression);
				closeExpr = text.indexOf(this.closingExpression) + this.closingExpression.length;
				length = closeExpr - openExpr;
			}
		}

		console.log(this.facts);

		node.innerHTML = text;
	}

	this.parse = function(el) {
		var nodes = this.textNodesInSelection(el);
		nodes = nodes.map(function(n) { return n.parentElement }).filter(function(n) { return n !== el });
		nodes.map(this.extract, this);
	}

	this.inline = function(el) {
		this.parse(el);
	}

	this.renderFactsModule = function(el) {
		var container = document.createElement('div');
		container.classList.add('newseful-fact-module');

		var list = document.createElement('ul');
		list.classList.add('newseful-fact-list');

		this.facts.reduce(function(list, fact) {
			var item = document.createElement('li');
			item.innerHTML = fact.text;
			item.dataset.status = fact.type;

			list.appendChild(item);
			return list;
		}, list);

		container.appendChild(list);

		el.insertBefore(container, el.childNodes[0]);

	}

	return this;
}