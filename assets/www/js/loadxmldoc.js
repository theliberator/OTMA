/**
 * Load an xml document and return the root node of the XML DOM object. Because
 * files have to be fetched from a remote site this is done asynchronously.
 *
 * @author	Michael Seider, Ulrich Hornung
 * @version 0.9
 * @since	10.5.2012
 */
function ConvertStringToXMLObject(sXML) {
	// Test for W3C feature
	con.debug("ConvertStringToXMLObject");
	if (DOMParser) {
		con.debug("Can use w3c feature for dom reading");
		var dpDOMParser = new DOMParser();
		return dpDOMParser.parseFromString(sXML, "text/xml");
	} else { // IE 8 and previous or IE 9 when *not* in Standards mode...
		con.debug("IE8... different version for dom reading");
		var xdDoc = new ActiveXObject("Microsoft.XMLDOM");
		xdDoc.loadXML(sXML);
		return xdDoc;
	}
}

function loadXMLDoc(dname, callback)
{
	con.debug("loadXMLDoc start");
	if (window.XMLHttpRequest) {
		xhttp=new XMLHttpRequest();
	} else {
		xhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && (xhttp.status == 200 || xhttp.status == 0))
		{
			var xml = ConvertStringToXMLObject(xhttp.responseText);
			callback(xml);
		}
	}
	xhttp.open("GET",dname);
	xhttp.send();
}
