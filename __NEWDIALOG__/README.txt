Beispiel eines verzweigten Dialogs:

Wie man sieht, noch nicht hundertprozentig fertig, aber funktioniert prinzipiell schon ganz gut.
Auf welche Arte und Weise man den Dialog am besten ins Game einbaut werden sollte, ist mir dann noch
nicht so ganz klar.

branchedDialog.html:
	Test-Seite mit Beispiel.
	ANMERKUNG:
	-In Chrome funktioniert der Code nur, wenn man das Verzeichnis 'branchedDialog' in einem WebServer
	hostet, da Chrome beim laden der XML-Datei sonst den Fehler 'Cross origin requests are only
	supported for HTTP.' produziert. Wenn man Python installiert hat, geht da Hosten zum testen am
	schnellsten, indem man in das Verzeichnis 'branchedDialog' wechselt und..

		python -m SimpleHTTPServer <portNumber>
												
	..aufruft. Dann kann man im Browser, mittels..
												
		localhost:<portNumber>/branchedDialog.html
												
	..die Seite als gehostete Seite im Browser aufrufen und das Laden der XML-Datei funktioniert
	problemlos.
	
	-Mit Firefox ist dies nicht notwendig.
						
	
branchedDialog.css:
	Stylesheet für den Dialog

branchedDialog.js:
	Aufrufen des Dialogs:
	-popup2(pageId)
	-pageId: id-Attribut eines DialogPage-Elements in 'branchedDialogExampleData.xml'.

branchedDialogExampleData.xml:
	XML-Struktur zur Definition von verzweigten Dialogen.
	
js/XMLConfigLoader.js (+js/loadxmldoc.js):
	Testhalber angepasste Variante der alten Version des XMLConfigLoaders (sollte aber trotzdem
	relativ einfach in die neue Version eingebaut werden können)

