/**
 * qwklist.com
 * @author nabeel shahzad <nshahzad@gmail.com>
 */
function pageActions(list) {

	$("div#list_parent").html(loadList(list, "list"));

	$("input.add_item").live('keydown', function(e) {

		var txtElem = $(this);

		if(e.which == 13) {
			e.preventDefault();
			var text = txtElem.val(); txtElem.val("");
			if(text.length == 0) { return; }

			txtElem.closest('li').before(liElement(null, text));
			saveChanges();
		}

		if(e.which == 9 && e.shiftKey) { // shift tab, to un-indent
			e.preventDefault();

			if($("ul#list li").length == 1)
				return false; // dont allow tab on first entry

			// find the parent UL and add an LI under that
			var text = txtElem.val(); txtElem.val("");
			var ul = txtElem.closest('ul');
			var new_li = ul.after(placeHolder(false)).next();
			new_li.children('input').val(text).focus();

			if(ul.children('li').length == 1) { // the ul is empty, remove it
				ul.remove();
			}

			txtElem.closest('li').remove();
		}

		else if(e.which == 9) { // tab so indent it
			e.preventDefault();
			indent(txtElem);
		}
	});

	$("a.mini_add").live('click', function(e) {

		e.preventDefault();
		var parent_li = $($(this).parents('li'));

		// see if there is a UL under this already, if so, see that we
		// don't have an input box already
		if(parent_li.find('ul').length > 0) {
			var find_inp = parent_li.find('ul li input');
			if(find_inp.length > 0) {
				find_inp.focus();
				return;
			}
		}

		$(parent_li[0]).append('<ul>'+placeHolder()+'</ul>');
		$(parent_li[0]).find('ul li input').focus();
	});

	/** editable list items */
	$("span.editable").live('click', function(e) {
		e.preventDefault();
		var text = $(this).html();
		// TODO: remove any other edit boxes
		
		var el = $(this).replaceWith("<input type='text' name='' class='edit_item' value='"+text+"' />");
		// TODO: focus on the above element
	});

	/* Press enter on the edit field from above, revert back to span and save it */
	$("input.edit_item").live('keydown', function(e) {
		var txtElem = $(this);
		if(e.which == 13) {
			var text = $(this).val();
			txtElem.replaceWith("<span class='editable'>"+text+"</span>");
			saveChanges();
		}
		else if(e.which == 9) { // tab so indent it
			e.preventDefault();
			indent(txtElem);
		}
	});
}

function indent(txtElem) {
	if($("ul#list li").length == 1)
		return false; // don't allow tab on first entry

	// get the closest UL in the same line as the LI
	var root_li = $(txtElem.parents('li')[0]);
	var elem = root_li.prev('ul'); // find a UL in the same vicinity

	if(elem.length == 0) {
		var adj_li = root_li.prev('li'); // append it to the last LI, if exists
		if(adj_li.length > 0) {
			adj_li.append('<ul>'+placeHolder(true, txtElem.val())+'</ul>');
			txtElem.closest('li').remove();
			adj_li.find('input').focus();
		}
	} else { // otherwise, just append it to the UL (add an LI)
		elem.append(placeHolder(true, txtElem.val()));
		elem.find('input').focus();
		$(txtElem.parents('li')[0]).remove(); // remove the original un-indented one
	}
}

function unindent(elem) {

}

/**
 * add a placeholding box for an item
 * @param include_input
 * @param value the input box
 */
function placeHolder(include_input, value) {

	value = (value == null || value === undefined) ? "" : value;
	include_input = (include_input === null || include_input === undefined) ? true : include_input;

	var tmp = "<li class='link'>";
	if(include_input === true) {
		tmp += "<input class='add_item' value='"+value+"' type='text' placeholder='add item' />";
	}
	tmp += "</li>";
	return tmp;
}

/**
 * add a list element
 * @param id ID of the list element
 * @param text actual list item text
 */
function liElement(id, text) {
	id = (id === null || id === undefined) ? murmurhash3_32_gc(text, new Date()) : id;
	return "<li id='"+id+"'><span class='editable'>"+text+"</span>&nbsp;&nbsp;<a href='#' class='mini_add'>(add)</a></li>";
}

/**
 * load a list recursively (as many levels deep as needed)
 * @param list object
 * @param ul_id ID to assign to the UL element
 */
function loadList(list, ul_id, placeholder) {
	placeholder = (placeholder === null || placeholder === undefined) ? true : placeholder;
	var list_html = '<ul id="'+ul_id+'" class="list">';
	$.each(list, function(i, item){
		if(item instanceof Array) { //wtf? typeof(item) === "object" >:O
			list_html += loadList(item, '', false);
		} else {
			list_html += liElement(item.id, item.title);
		}
	});

	list_html += (placeholder === true) ? placeHolder() : "";

	list_html += "</ul>";
	return list_html;
}

/**
 * recursively go through the list items and form a serialized array
 * @param list root element
 */
function serializeList(list) {
	var siList = [];
	$.each($(list).children(), function(i, item) {
		if(item.tagName === 'UL') {
			siList.push(serializeList($(item)));
		} else if(item.tagName === 'LI') {
			if($(item).hasClass('link'))
				return;
			siList.push({id: item.id, icon: "none", title: $(item).html()});
		}
	});
	return siList;
}

/**
 * save the serialized list
 */
function saveChanges() {
	var list = serializeList($("ul#list"));
	var data = JSON.stringify(serializeList($("ul#list")));
	//$("div#list_parent").html(loadList(list, "list"));
	// TODO save this shit
	$.ajax('/save', {
		dataType: 'json', data: {
			auth: '', prefix: '', name: '', list: data
		},
		success: function (d, t, xhr) {
			console.log(d);
		}
	});
}

function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
	  	k1 =
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);

		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 16) | (k1 >>> 16);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}