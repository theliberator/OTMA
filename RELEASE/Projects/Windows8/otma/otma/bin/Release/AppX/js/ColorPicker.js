/**
 * function : ColorPicker: This function extends jQuery and can be used to
 * generate some fields of colors as a color picker. To define the colors which
 * are used, the property colors can be overridden by defining it as a part of
 * the props list parameter.
 * 
 * 
 * @author Richard Grötsch
 * @version 1.0
 * @since 29.05.2012
 */

jQuery.fn.addColorPicker = function(props) {
	if (!props) {
		props = [];
	}
	props = jQuery.extend({
		blotchElemType : 'span',
		blotchClass : 'ColorPicker',
		fillString : '&nbsp;&nbsp;',
		context : null,
		colors : [ 'white', 'tomato', 'cornflowerblue', 'yellow',
				'springgreen', 'violet' ]
	}, props);
	var count = props.colors.length;
	for ( var i = 0; i < count; ++i) {
		var color = props.colors[i];
		var elem = jQuery('<' + props.blotchElemType + '/>').addClass(
				props.blotchClass).css({
			"background-color" : color
		});
		elem.html(props.fillString);
		if (i == 0) {
			elem.css({
				"border-color" : "#e20000",
				"border-width" : "3px"
			});
			elem.attr("id", "default" + props.context + "Color");
		}
		elem.attr("title", props.colors[i]);
		if (props.clickCallback) {
			elem.click(function() {
				props.clickCallback(jQuery(this), jQuery(this).css(
						'background-color'));
			});
		}
		this.append(elem);
	}
	return this;
};