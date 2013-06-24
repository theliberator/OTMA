/**
 * All helper functions in one file
 * 
 * @author	Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
var helper = {
	rand: function (lo, hi)
	{
		return Math.floor(Math.random() * (hi - lo)) + lo;
	},
	
	 contains: function (a, obj)
	{
		for (var i = 0; i < a.length; i++) {
			if (a[i] === obj) {
				return true;
			}
		}
		return false;
	},
	
	concat: function (str, adds, sep)
	{
		if (sep == undefined)
			sep = "_";
		var ret_str = str;
		for(var i = 0; i < adds.length; i++)
		{
			add = adds[i];
			ret_str += sep + add;
		}
		return ret_str;
	}
}

