function pageActions(list) {

	$("div#list_parent").html(loadList(list, "list"));

	$("input.add_item").live('keydown', function(e) {

		if(e.which == 13) {
			var text = $(this).val(); $(this).val("");
			$(this).closest('li').before(liElement(null, text));
			saveChanges();
		}

		else if(e.which == 9 && e.shiftKey) { // they pressed tab so indent it

			$(this).closest('li')
				.replaceWith("<ul>" +placeHolder($(this).val()) +"</ul>")
				.append(placeHolder());

			console.log($(this).parents('ul'));
		}
	});

	/** editable list items */
	$("li.editable").live('click', function(e) {
		e.preventDefault();
		var newtext = prompt("", this.innerHTML);
		if(newtext === null || typeof(newtext) === 'undefined') {
			return;
		}

		this.innerHTML = newtext;
		saveChanges();
	})
}
/**
 * load a list recursively (as many levels deep as needed)
 * @param list object
 * @param ul_id ID to assign to the UL element
 */
function loadList(list, ul_id) {
	var list_html = '<ul id="'+ul_id+'" class="list">';
	$.each(list, function(i, item){
		if(item instanceof Array) { //wtf? typeof(item) === "object" >:o
			list_html += loadList(item, '');
		} else {
			list_html += liElement(item.id, item.title);
		}
	});

	list_html += placeHolder();;
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
		if(item.tagName === 'UL') {;
			siList.push(serializeList($(item)));
		} else if(item.tagName === 'LI') {
			if($(item).hasClass('link')) {
				return;
			}
			
			siList.push({id: item.id, icon: "none", title: $(item).html()})
		}
	});
	return siList;
}

// Some basic functions for templating

function placeHolder(value) {
	value = value || "";
	return "<li class='link'><input class='add_item' value='"+value+"' type='text' placeholder='add item' /></li>";
}

function liElement(id, text) {
	id = id || murmurhash3_32_gc(text, new Date());
	return "<li class='editable' id='"+id+"'>"+text+"</li>";
}

function saveChanges() {
	data = JSON.stringify(serializeList($("ul#list")));
	console.log(data);
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